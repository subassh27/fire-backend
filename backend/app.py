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

# =============================
# Global variables
# =============================
temperature = 0
fire = False
flammableGas = False
smokeLevel = 0

last_fire_state = False
last_gas_state = False
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
        "fire": fire,
        "flammableGas": flammableGas,
        "smokeLevel": smokeLevel
    })

# =============================
@app.route("/update", methods=["POST"])
def update():
    global temperature, fire, flammableGas, smokeLevel
    global last_fire_state, last_gas_state, last_sms_time

    try:
        data = request.get_json(force=True)

        if data is None:
            return jsonify({"error": "No JSON received"}), 400

        temperature = float(data.get("temperature", 0))
        fire = bool(data.get("fire", False))
        flammableGas = bool(data.get("flammableGas", False))
        smokeLevel = int(data.get("smokeLevel", 0))

        print(f"Temp: {temperature}, Fire: {fire}, Gas: {flammableGas}, Smoke: {smokeLevel}")

        current_time = time.time()

        # =============================
        # FIRE SMS
        # =============================
        if (fire or temperature > 50):
            if (not last_fire_state) and (current_time - last_sms_time > SMS_COOLDOWN):
                client.messages.create(
                    body=f"🔥 FIRE ALERT!\nTemperature: {temperature}°C\n\nLIVE MONITOR: https://fire-backend-wheat.vercel.app/",
                    from_=TWILIO_PHONE_NUMBER,
                    to=ALERT_PHONE_NUMBER
                )
                last_sms_time = current_time
                print("🔥 Fire SMS Sent!")

        # =============================
        # GAS LEAK SMS
        # =============================
        if flammableGas:
            if (not last_gas_state) and (current_time - last_sms_time > SMS_COOLDOWN):
                client.messages.create(
                    body=f"⚠ FLAMMABLE GAS DETECTED!\nSmoke Level: {smokeLevel}\n\nPrecaution:\n- Open windows\n- Do NOT switch electrical appliances\n- Avoid fire/sparks\n\nLIVE MONITOR: https://fire-backend-wheat.vercel.app/",
                    from_=TWILIO_PHONE_NUMBER,
                    to=ALERT_PHONE_NUMBER
                )
                last_sms_time = current_time
                print("🧪 Gas SMS Sent!")

        last_fire_state = fire
        last_gas_state = flammableGas

        return jsonify({"message": "Data updated successfully"}), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)