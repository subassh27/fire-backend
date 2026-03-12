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
firePrediction = 0

last_fire_state = False
last_gas_state = False
last_smoke_state = False
last_prediction_state = False

last_sms_time = 0
SMS_COOLDOWN = 40

SMOKE_THRESHOLD = 1800
PREDICTION_THRESHOLD = 70

# =============================
# FIRE CONFIRMATION TIMER
# =============================
fire_start_time = None
FIRE_CONFIRMATION_TIME = 0.3


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
        "smokeLevel": smokeLevel,
        "firePrediction": firePrediction
    })


# =============================
@app.route("/update", methods=["POST"])
def update():

    global temperature, fire, flammableGas, smokeLevel, firePrediction
    global last_fire_state, last_gas_state
    global last_smoke_state, last_prediction_state
    global last_sms_time
    global fire_start_time

    try:

        data = request.get_json(force=True)

        if data is None:
            return jsonify({"error": "No JSON received"}), 400

        temperature = float(data.get("temperature", 0))
        fire = bool(data.get("fire", False))
        flammableGas = bool(data.get("flammableGas", False))
        smokeLevel = int(data.get("smokeLevel", 0))
        firePrediction = float(data.get("firePrediction", 0))

        print(f"Temp: {temperature}, Fire: {fire}, Gas: {flammableGas}, Smoke: {smokeLevel}, Prediction: {firePrediction}")

        current_time = time.time()

        # =============================
        # FIRE SMS WITH CONFIRMATION
        # =============================
        if (fire or temperature > 50):

            if fire_start_time is None:
                fire_start_time = current_time

            fire_duration = current_time - fire_start_time

            if fire_duration >= FIRE_CONFIRMATION_TIME:

                if (not last_fire_state) and (current_time - last_sms_time > SMS_COOLDOWN):

                    client.messages.create(
                        body=f"🔥 FIRE ALERT!\nTemperature: {temperature}°C\n\nEvacuate Safely & Call 101.\nLIVE MONITOR: https://fire-backend-wheat.vercel.app/",
                        from_=TWILIO_PHONE_NUMBER,
                        to=ALERT_PHONE_NUMBER
                    )

                    last_sms_time = current_time
                    last_fire_state = True

                    print("🔥 Fire SMS Sent!")

        else:
            fire_start_time = None
            last_fire_state = False


        # =============================
        # GAS LEAK SMS
        # =============================
        if flammableGas:

            if (not last_gas_state) and (current_time - last_sms_time > SMS_COOLDOWN):

                client.messages.create(
                    body=f"⚠ FLAMMABLE GAS DETECTED!\nSmoke Level: {smokeLevel}\n\nPrecautions:\n- Open windows\n- Do NOT switch appliances\n- Avoid sparks\n\nLIVE MONITOR: https://fire-backend-wheat.vercel.app/",
                    from_=TWILIO_PHONE_NUMBER,
                    to=ALERT_PHONE_NUMBER
                )

                last_sms_time = current_time
                last_gas_state = True

                print("🧪 Gas SMS Sent!")

        else:
            last_gas_state = False


        # =============================
        # HIGH SMOKE LEVEL SMS
        # =============================
        if smokeLevel >= SMOKE_THRESHOLD:

            if (not last_smoke_state) and (current_time - last_sms_time > SMS_COOLDOWN):

                client.messages.create(
                    body=f"💨 HIGH SMOKE LEVEL!\nSmoke Level: {smokeLevel}\n\nEvacuate Safely & Improve Ventilation.\nLIVE MONITOR: https://fire-backend-wheat.vercel.app/",
                    from_=TWILIO_PHONE_NUMBER,
                    to=ALERT_PHONE_NUMBER
                )

                last_sms_time = current_time
                last_smoke_state = True

                print("💨 Smoke SMS Sent!")

        else:
            last_smoke_state = False


        # =============================
        # FIRE PREDICTION SMS
        # =============================
        if firePrediction >= PREDICTION_THRESHOLD:

            if (not last_prediction_state) and (current_time - last_sms_time > SMS_COOLDOWN):

                client.messages.create(
                    body=f"🔥 FIRE RISK HIGH!\nPrediction Level: {firePrediction}%\n\nEvacuate Safely & Follow Exit Routes.\nCall 101 if needed.\nLIVE MONITOR: https://fire-backend-wheat.vercel.app/",
                    from_=TWILIO_PHONE_NUMBER,
                    to=ALERT_PHONE_NUMBER
                )

                last_sms_time = current_time
                last_prediction_state = True

                print("🔥 Prediction SMS Sent!")

        else:
            last_prediction_state = False


        return jsonify({"message": "Data updated successfully"}), 200


    except Exception as e:

        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# =============================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)