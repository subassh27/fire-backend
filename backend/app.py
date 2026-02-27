from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# store latest data
latest_data = {
    "fire": False,
    "temperature": 0
}

# ESP32 will send data here
@app.route("/update", methods=["POST"])
def update():
    global latest_data
    data = request.json
    latest_data["fire"] = data.get("fire", False)
    latest_data["temperature"] = data.get("temperature", 0)
    return jsonify({"message": "Data updated"}), 200

# Website reads data from here
@app.route("/status")
def status():
    return jsonify(latest_data)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)