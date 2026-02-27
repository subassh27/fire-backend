import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

let sensorData = {
  temperature: 0,
  flame: 0,
  time: ""
};

app.post("/api/data", (req, res) => {
  sensorData = {
    temperature: req.body.temperature,
    flame: req.body.flame,
    time: new Date().toLocaleTimeString()
  };

  console.log("Received:", sensorData);
  res.json({ message: "Data received" });
});

app.get("/api/data", (req, res) => {
  res.json(sensorData);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});