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
          const fireDetected = fireFromBackend || temp > 50;

          setData({
            temperature: temp,
            flame_value: fireFromBackend,
            fire: fireDetected,
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

  let gradientId = "safeGradient";
  if (data.temperature <= 35) gradientId = "safeGradient";
  else if (data.temperature <= 45) gradientId = "mediumGradient";
  else gradientId = "dangerGradient";

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
          {/* Temperature Card */}
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

          {/* Flame Card */}
          <div className="sensor-card">
            <h3>Flame Sensor</h3>
            <div className={`flame-container ${data.fire ? "active" : ""}`}>
              <div className="real-flame">
                <svg viewBox="0 27 119 180">
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

        {/* Temperature Chart */}
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
                  time: { unit: "second" },
                },
                y: { min: 0, max: maxTemp },
              },
            }}
          />
        </div>

        {/* 🚨 EMERGENCY SECTION */}
        <div className="emergency-section">
          <h3>🚨 Emergency Contacts</h3>

          <div className="emergency-buttons">
            <a href="tel:101" className="emergency-btn fire-btn">
              🔥 Fire - 101
            </a>

            <a href="tel:108" className="emergency-btn ambulance-btn">
              🚑 Ambulance - 108
            </a>

            <a href="tel:112" className="emergency-btn emergency-btn-black">
              🆘 Emergency - 112
            </a>
          </div>
        </div>

        <div className="activity-log">
          <h3>Recent Activity</h3>
          {logs.length === 0
            ? <p>No recent alerts</p>
            : logs.map((log, index) => <p key={index}>{log}</p>)}
        </div>
      </div>
    </div>
  );
}

export default App;