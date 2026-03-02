import os
import time
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
last_fire_state = False
last_sms_time = 0

SMS_COOLDOWN = 30  # seconds

# =============================
@app.route("/")
def home():
    return "🔥 Fire Detection Backend Running Successfully!"

# =============================
@app.route("/status")
def status():
    return jsonify({
        "temperature": temperature,
        "fire": fire
    })

# =============================
@app.route("/update", methods=["POST"])
def update():
    global temperature, fire, last_fire_state, last_sms_time

    try:
        data = request.get_json()

        temperature = data.get("temperature", 0)
        fire = data.get("fire", False)

        print("Temperature:", temperature)
        print("Fire:", fire)

        current_time = time.time()

        # 🔥 Send SMS ONLY when fire starts (False → True)
        if (fire or temperature > 50):

            if (not last_fire_state) and (current_time - last_sms_time > SMS_COOLDOWN):

                client.messages.create(
                    body=f"🔥 ALERT! Fire Detected!\nTemperature: {temperature}°C\n\nLIVE MONITOR: https://fire-backend-wheat.vercel.app/",
                    from_=TWILIO_PHONE_NUMBER,
                    to=ALERT_PHONE_NUMBER
                )

                last_sms_time = current_time
                print("SMS Sent")

        last_fire_state = fire

        return jsonify({"message": "Data updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))