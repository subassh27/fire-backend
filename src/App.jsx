import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  TimeScale
);

function App() {
  const [data, setData] = useState({
    temperature: 0,
    flame_value: 0,
    fire: false,
    flammableGas: false,
    smokeLevel: 0,
  });

  const [logs, setLogs] = useState([]);
  const [time, setTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState("");
  const [muted, setMuted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [tempHistory, setTempHistory] = useState([]);
  const audioRef = useRef(null);

  const toggleMute = () => setMuted(!muted);
  const toggleTheme = () => setDarkMode(!darkMode);

  const maxTemp = 100;

  useEffect(() => {
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    const fetchData = () => {
      fetch("https://fire-backend-ipvf.onrender.com/status")
        .then((res) => res.json())
        .then((result) => {
          const temp = result.temperature || 0;
          const fireFromBackend = result.fire || false;
          const gasDetected = result.flammableGas || false;
          const smokeLevel = result.smokeLevel || 0;
          const fireDetected = fireFromBackend || temp > 50;

          setData({
            temperature: temp,
            flame_value: fireFromBackend,
            fire: fireDetected,
            flammableGas: gasDetected,
            smokeLevel: smokeLevel,
          });

          const now = new Date();
          setTempHistory((prev) => {
            const updated = [...prev, { temp, timestamp: now }];
            return updated.filter((item) => now - item.timestamp <= 60000);
          });

          setLastUpdated(now.toLocaleTimeString());

          if (fireDetected) {
            setLogs((prev) => [
              `🔥 Fire detected at ${now.toLocaleTimeString()}`,
              ...prev.slice(0, 4),
            ]);
          }

          if (fireDetected && !muted && audioRef.current) {
            audioRef.current.play().catch(() => {});
          } else if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        })
        .catch((err) => console.log(err));
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [muted]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const percentage = data.temperature / maxTemp;
  const offset = circumference - percentage * circumference;

  let predictionScore = 0;
  if (data.flammableGas) predictionScore += 40;
  if (data.temperature > 40) predictionScore += 30;
  if (data.temperature > 50) predictionScore += 30;
  if (predictionScore > 100) predictionScore = 100;

  let gradientId = "safeGradient";
  if (data.temperature <= 35) gradientId = "safeGradient";
  else if (data.temperature <= 45) gradientId = "mediumGradient";
  else gradientId = "dangerGradient";

  // ✅ Smoke dynamic color
  let smokeColor = "#00ff00";
  if (data.smokeLevel > 1600) smokeColor = "#ff9900";
  if (data.smokeLevel > 2500) smokeColor = "#ff0000";

  // ✅ Prediction dynamic color
  let predictionColor = "#00ff00";
  if (predictionScore > 40) predictionColor = "#ff9900";
  if (predictionScore > 70) predictionColor = "#ff0000";

  return (
    <div className={darkMode ? "background dark" : "background light"}>
      <audio ref={audioRef} src="/alarm.mp3" loop preload="auto" />

      <div className="dashboard">
        <div className="header">
          <h1>🔥 Fire Monitoring Dashboard</h1>
          <div className="controls">
            <button className="control-btn" onClick={toggleMute}>
              {muted ? "🔈" : "🔊"}
            </button>
            <div className="theme-toggle" onClick={toggleTheme}>
              <div className={`toggle-track ${darkMode ? "dark" : "light"}`}>
                <div className="toggle-thumb">{darkMode ? "🌙" : "⛅"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="clock">
          <p>{time.toLocaleTimeString()}</p>
          <span>Last updated: {lastUpdated}</span>
        </div>

        {data.fire && (
          <div className="alert-banner">
            🚨 FIRE ALERT — TAKE ACTION IMMEDIATELY
          </div>
        )}

        <div className={`status-card ${data.fire ? "danger pulse" : "safe"}`}>
          <h2>Status</h2>
          <p>{data.fire ? "FIRE DETECTED" : "All Systems Normal"}</p>
        </div>

        <div className="sensor-grid">
          <div className="sensor-card">
            <h3>Temperature</h3>
            <svg width="150" height="150" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="safeGradient">
                  <stop offset="0%" stopColor="#006400" />
                  <stop offset="100%" stopColor="#00ff00" />
                </linearGradient>
                <linearGradient id="mediumGradient">
                  <stop offset="0%" stopColor="#ffff66" />
                  <stop offset="100%" stopColor="#ff9900" />
                </linearGradient>
                <linearGradient id="dangerGradient">
                  <stop offset="0%" stopColor="#ff8080" />
                  <stop offset="100%" stopColor="#b30000" />
                </linearGradient>
              </defs>

              <circle stroke="#444" fill="transparent" strokeWidth="10" r={radius} cx="75" cy="75" />
              <circle
                stroke={`url(#${gradientId})`}
                fill="transparent"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                r={radius}
                cx="75"
                cy="75"
              />
            </svg>
            <p className="temp-value">{data.temperature} °C</p>
          </div>

          <div className="sensor-card">
            <h3>Flame Sensor</h3>
            <div className={`flame-container ${data.fire ? "active" : ""}`}>
              <div className="real-flame">
                <svg viewBox="0 27 119 180" className="flame-svg">
                  <defs>
                    <radialGradient id="fireGradient">
                      <stop offset="0%" stopColor="#fff176" />
                      <stop offset="40%" stopColor="#ff9800" />
                      <stop offset="70%" stopColor="#ff5722" />
                      <stop offset="100%" stopColor="#b71c1c" />
                    </radialGradient>
                  </defs>
                  <g transform="translate(10,0)">
                    <path
                      d="M100 170 C70 130 85 90 100 60 C115 90 130 130 100 170 Z"
                      fill="url(#fireGradient)"
                      className="flame-shape"
                    />
                  </g>
                </svg>

                <div className="spark s1"></div>
                <div className="spark s2"></div>
                <div className="spark s3"></div>
                <div className="spark s4"></div>
              </div>
              <p className="flame-text">
                {data.fire ? "Flame Detected" : "No Flame Detected"}
              </p>
            </div>
          </div>
        </div>

        <div className="sensor-card" style={{ marginTop: "20px" }}>
          <h3>Temperature vs Time (Last 1 min)</h3>
          <Line
            data={{
              labels: tempHistory.map((item) => item.timestamp),
              datasets: [
                {
                  label: "Temperature (°C)",
                  data: tempHistory.map((item) => item.temp),
                  borderColor: "#ff5722",
                  backgroundColor: "rgba(255,87,34,0.2)",
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              scales: {
                x: {
                  type: "time",
                  time: { unit: "second", displayFormats: { second: "h:mm:ss" } },
                },
                y: { min: 0, max: maxTemp },
              },
            }}
          />
        </div>

        <div className="smart-sensor-grid" style={{ marginTop: "30px" }}>
          <div className="sensor-card">
            <h3>Flammable Gas Detection</h3>
           <div
  style={{
    fontSize: "22px",
    marginTop: "15px",
    color: data.flammableGas ? "#ff3b3b" : "#22c55e",
    fontWeight: "600"
  }}
>
  {data.flammableGas ? "⚠ Gas Detected" : "Safe"}
</div>
          </div>

          <div className="sensor-card">
            <h3>Smoke Level</h3>
            <div className="smoke-bar">
              <div
                className="smoke-fill"
                style={{
                  width: `${Math.min((data.smokeLevel / 4000) * 100, 100)}%`,
                  background: smokeColor,
                  transition: "width 0.6s ease-in-out",
                }}
              ></div>
            </div>
            <p style={{ marginTop: "10px" }}>{data.smokeLevel}</p>
          </div>

<div className="sensor-card precaution-card">
  <h3>⚠ Precautions</h3>

  {data.flammableGas && (
    <p>🚪 Open doors and windows immediately.</p>
  )}

  {data.fire && (
    <p>
      🔥 Use fire extinguisher. Do not use water on electrical and oil fires.
    </p>
  )}

  {data.smokeLevel > 900 && (
    <p>💨 Ensure ventilation. Avoid inhaling smoke.</p>
  )}

 {data.smokeLevel > 600 && (
    <p>💚 No precautions required.</p>
  )}

  {data.temperature > 45 && (
    <p>🌡 High temperature detected. Check the cause immediately.</p>
  )}

  {!data.flammableGas &&
    !data.fire &&
    data.smokeLevel <= 600 &&
    data.temperature <= 45 && (
      <p>✅ Environment is safe.</p>
  )}
</div>

          <div className="sensor-card" style={{ gridColumn: "1 / -1" }}>
            <h3>🔥 Fire Prediction Level</h3>
            <div className="prediction-bar">
              <div
                className="prediction-fill"
                style={{
                  width: `${predictionScore}%`,
                  background: predictionColor,
                  transition: "width 0.6s ease-in-out",
                }}
              ></div>
            </div>
            <p style={{ marginTop: "10px" }}>{predictionScore}% Risk</p>
          </div>
        </div>

        <div className="activity-log">
          <h3>Recent Activity</h3>
          {logs.length === 0
            ? <p>No recent alerts</p>
            : logs.map((log, index) => <p key={index}>{log}</p>)}
        </div>

        <div class="emergency-footer">
  <div class="ticker-wrapper">

    <div class="ticker">
      <span>🚑 Ambulance: 108 – Provide First Aid & Stay Calm</span>
      <span>🔥 Fire Dept: 101 – Evacuate Safely</span>
      <span>👮 Police: 100 – Maintain Order & Avoid Panic</span>
      <span>🏥 Medical Helpline: 102 – Seek Immediate Assistance</span>
      <span>📞 Disaster Management: 1070 – Follow Official Instructions</span>
    </div>

    <div class="ticker">
      <span>🚑 Ambulance: 108 – Provide First Aid & Stay Calm</span>
      <span>🔥 Fire Dept: 101 – Evacuate Safely</span>
      <span>👮 Police: 100 – Maintain Order & Avoid Panic</span>
      <span>🏥 Medical Helpline: 102 – Seek Immediate Assistance</span>
      <span>📞 Disaster Management: 1070 – Follow Official Instructions</span>
    </div>

  </div>
</div>
      </div>
    </div>
  );
}

export default App;