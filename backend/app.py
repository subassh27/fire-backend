from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from twilio.rest import Client

app = Flask(__name__)
CORS(app)

latest_data = {
    "fire": False,
    "temperature": 0
}

def send_sms(message):
    account_sid = os.environ.get("TWILIO_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_number = os.environ.get("TWILIO_PHONE")

    client = Client(account_sid, auth_token)

    client.messages.create(
        body=message,
        from_=twilio_number,
        to="+919363025728"
    )

@app.route("/update", methods=["POST"])
def update():
    global latest_data
    data = request.json

    fire = data.get("fire", False)
    temperature = data.get("temperature", 0)

    latest_data["fire"] = fire
    latest_data["temperature"] = temperature

    if fire:
        send_sms(f"🔥 FIRE ALERT! Temperature: {temperature}°C")

    return jsonify({"message": "Data updated"}), 200

@app.route("/status")
def status():
    return jsonify(latest_data)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)