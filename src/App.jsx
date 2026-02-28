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
  Legend
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

function App() {
  const [data, setData] = useState({
    temperature: 0,
    flame_value: 0,
    fire: false,
  });
  const [isAlert, setIsAlert] = useState(false); // ✅ Alert state
  const [logs, setLogs] = useState([]);
  const [time, setTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState("");
  const [muted, setMuted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [tempHistory, setTempHistory] = useState([]);
  const [timeHistory, setTimeHistory] = useState([]);
  const audioRef = useRef(null);

  const toggleMute = () => setMuted(!muted);
  const toggleTheme = () => setDarkMode(!darkMode);

  // Clock
  useEffect(() => {
    const clock = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // Fetch data from backend every 3 seconds
  useEffect(() => {
    const fetchData = () => {
      fetch("https://fire-backend-ipvf.onrender.com/status")
        .then(res => res.json())
        .then(result => {
          const temp = result.temperature || 0;
          const fireFromBackend = result.fire || false;

          const fireDetected = fireFromBackend || temp > 50;

          setData({
            temperature: temp,
            flame_value: fireFromBackend,
            fire: fireDetected,
          });

          setIsAlert(fireDetected); // ✅ update alert state

          setTempHistory(prev => {
            const updated = [...prev, temp];
            if (updated.length > 10) updated.shift();
            return updated;
          });

          setTimeHistory(prev => {
            const updated = [...prev, new Date().toLocaleTimeString()];
            if (updated.length > 10) updated.shift();
            return updated;
          });

          setLastUpdated(new Date().toLocaleTimeString());

          if (fireDetected) {
            setLogs(prev => [
              `🔥 Fire detected at ${new Date().toLocaleTimeString()}`,
              ...prev.slice(0, 4),
            ]);
          }
        })
        .catch(err => console.log(err));
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Alarm MP3
  useEffect(() => {
    if (!audioRef.current) return;

    if (isAlert && !muted) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isAlert, muted]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const percentage = data.temperature / 40;
  const offset = circumference - percentage * circumference;

  let gradientId = "safeGradient";
  if (data.temperature > 42) gradientId = "dangerGradient";
  else if (data.temperature > 33) gradientId = "mediumGradient";

  return (
    <div className={darkMode ? "background dark" : "background light"}>
      <audio ref={audioRef} src="/alarm.mp3" loop />

      <div className="dashboard">
        <div className="header">
          <h1>🔥 Fire Monitoring Dashboard</h1>

          <div className="controls">
            <button className="control-btn" onClick={toggleMute}>
              {muted ? "🔈" : "🔊"}
            </button>

            <div className="theme-toggle" onClick={toggleTheme}>
              <div className={`toggle-track ${darkMode ? "dark" : "light"}`}>
                <div className="toggle-thumb">
                  {darkMode ? "🌙" : "⛅"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="clock">
          <p>{time.toLocaleTimeString()}</p>
          <span>Last updated: {lastUpdated}</span>
        </div>

        {isAlert && (
          <div className="alert-banner">
            🚨 FIRE ALERT — TAKE ACTION IMMEDIATELY
          </div>
        )}

        <div className={`status-card ${isAlert ? "danger pulse" : "safe"}`}>
          <h2>Status</h2>
          <p>{isAlert ? "FIRE DETECTED" : "All Systems Normal"}</p>
        </div>

        <div className="sensor-grid">
          <div className="sensor-card">
            <h3>Temperature</h3>
            <svg width="150" height="150" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="safeGradient">
                  <stop offset="100%" stopColor="#09884b" />
                  <stop offset="100%" stopColor="#00e677" />
                </linearGradient>

                <linearGradient id="mediumGradient">
                  <stop offset="100%" stopColor="#fdcf00" />
                  <stop offset="100%" stopColor="#ff7b00" />
                </linearGradient>

                <linearGradient id="dangerGradient">
                  <stop offset="100%" stopColor="#ff5252" />
                  <stop offset="100%" stopColor="#920000" />
                </linearGradient>
              </defs>

              <circle
                stroke="#444"
                fill="transparent"
                strokeWidth="10"
                r={radius}
                cx="75"
                cy="75"
              />

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
                      <stop offset="0%" stopColor="#09884b" />
                      <stop offset="40%" stopColor="#ff9800" />
                      <stop offset="70%" stopColor="#ff7b00" />
                      <stop offset="100%" stopColor="#920000" />
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

        <div className="activity-log">
          <h3>Recent Activity</h3>
          {logs.length === 0 ? (
            <p>No recent alerts</p>
          ) : (
            logs.map((log, index) => <p key={index}>{log}</p>)
          )}
        </div>

        <div className="sensor-card" style={{ marginTop: "20px" }}>
          <h3>Temperature vs Time</h3>
          <Line
            data={{
              labels: timeHistory,
              datasets: [
                {
                  label: "Temperature (°C)",
                  data: tempHistory,
                  borderColor: "#ff5722",
                  backgroundColor: "rgba(255,87,34,0.2)",
                  tension: 0.3
                }
              ]
            }}
            options={{
              responsive: true,
              scales: {
                y: { min: 0, max: 80 } // adjust to show higher temps
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;