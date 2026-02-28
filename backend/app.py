from flask import Flask, jsonify, request
from flask_cors import CORS
from twilio.rest import Client
import os

app = Flask(__name__)
CORS(app)

temperature = 0
fire = False

@app.route("/status")
def status():
    return jsonify({
        "temperature": temperature,
        "fire": fire
    })

@app.route("/update", methods=["POST"])
def update():
    global temperature, fire

    data = request.json
    temperature = data.get("temperature", 0)
    fire = data.get("fire", False)

    # Twilio SMS logic
    if temperature > 50 or fire == True:
        account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        client = Client(account_sid, auth_token)

        client.messages.create(
            body=f"ALERT! Temp: {temperature}, Fire: {fire}",
            from_=os.environ.get("TWILIO_PHONE_NUMBER"),
            to=os.environ.get("TO_PHONE_NUMBER")
        )

    return jsonify({"message": "Updated successfully"})

if __name__ == "__main__":
    app.run(debug=True)