import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from twilio.rest import Client

app = Flask(__name__)
CORS(app)

# =============================
# Environment Variables
# =============================
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")
ALERT_PHONE_NUMBER = os.environ.get("ALERT_PHONE_NUMBER")

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

temperature = 0
fire = False

# =============================
# Home Route
# =============================
@app.route("/")
def home():
    return "🔥 Fire Detection Backend Running Successfully!"

# =============================
# Status Route
# =============================
@app.route("/status")
def status():
    return jsonify({
        "temperature": temperature,
        "fire": fire
    })

# =============================
# ESP32 Update Route
# =============================
@app.route("/update", methods=["POST"])
def update():
    global temperature, fire

    try:
        data = request.get_json()

        temperature = data.get("temperature", 0)
        fire = data.get("fire", False)

        print("Temperature:", temperature)
        print("Fire:", fire)

        # 🔥 Send SMS if fire detected
        if fire or temperature > 50:
            message = client.messages.create(
                body=f"🔥 ALERT! Fire Detected!\nTemperature: {temperature}°C\n\nLIVE MONITOR: https://fire-backend-wheat.vercel.app/",
                from_=TWILIO_PHONE_NUMBER,
                to=ALERT_PHONE_NUMBER
            )
            print("SMS Sent:", message.sid)

        return jsonify({"message": "Data updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# =============================
# Local Run (Render ignores this)
# =============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))