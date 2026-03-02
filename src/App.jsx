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
    fire: false,
  });

  const [logs, setLogs] = useState([]);
  const [time, setTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState("");
  const [muted, setMuted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [tempHistory, setTempHistory] = useState([]);
  const [previousFireState, setPreviousFireState] = useState(false);

  const audioRef = useRef(null);
  const maxTemp = 100;

  // Clock
  useEffect(() => {
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  // Fetch real-time data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://fire-backend-ipvf.onrender.com/status",
          { cache: "no-store" }
        );

        if (!res.ok) return;

        const result = await res.json();

        const temp =
          typeof result.temperature === "number"
            ? result.temperature
            : parseFloat(result.temperature) || 0;

        const fireFromBackend = Boolean(result.fire);
        const fireDetected = fireFromBackend || temp > 50;

        setData({
          temperature: temp,
          fire: fireDetected,
        });

        const now = new Date();
        setLastUpdated(now.toLocaleTimeString());

        // Temperature history (last 60 sec)
        setTempHistory((prev) => {
          const updated = [...prev, { temp, timestamp: now }];
          return updated.filter(
            (item) => now - item.timestamp <= 60000
          );
        });

        // Log only when fire state changes
        if (fireDetected && !previousFireState) {
          setLogs((prev) => [
            `🔥 Fire detected at ${now.toLocaleTimeString()}`,
            ...prev.slice(0, 4),
          ]);
        }

        setPreviousFireState(fireDetected);

        // Alarm control
        if (fireDetected && !muted) {
          audioRef.current?.play().catch(() => {});
        } else {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
        }
      } catch (err) {
        console.log("Fetch error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 700); // ⚡ faster refresh (0.7s)

    return () => clearInterval(interval);
  }, [muted, previousFireState]);

  // Circle progress
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(data.temperature / maxTemp, 1);
  const offset = circumference - percentage * circumference;

  return (
    <div className={darkMode ? "background dark" : "background light"}>
      <audio ref={audioRef} src="/alarm.mp3" loop />

      <div className="dashboard">
        <div className="header">
          <h1>🔥 Fire Monitoring Dashboard</h1>

          <div className="controls">
            <button onClick={() => setMuted(!muted)}>
              {muted ? "🔈" : "🔊"}
            </button>

            <button onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? "🌙" : "☀️"}
            </button>
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

        <div className={`status-card ${data.fire ? "danger" : "safe"}`}>
          <h2>Status</h2>
          <p>
            {data.fire ? "FIRE DETECTED" : "All Systems Normal"}
          </p>
        </div>

        <div className="sensor-grid">
          <div className="sensor-card">
            <h3>Temperature</h3>

            <svg width="150" height="150" style={{ transform: "rotate(-90deg)" }}>
              <circle
                stroke="#444"
                fill="transparent"
                strokeWidth="10"
                r={radius}
                cx="75"
                cy="75"
              />
              <circle
                stroke={data.fire ? "#ff3b3b" : "#00ff99"}
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
            <p>
              {data.fire
                ? "🔥 Flame Detected"
                : "No Flame Detected"}
            </p>
          </div>
        </div>

        <div className="activity-log">
          <h3>Recent Activity</h3>
          {logs.length === 0 ? (
            <p>No recent alerts</p>
          ) : (
            logs.map((log, index) => (
              <p key={index}>{log}</p>
            ))
          )}
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
              animation: false, // ⚡ remove chart animation for speed
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
      </div>
    </div>
  );
}

export default App;