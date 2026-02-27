from flask import Flask, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

@app.route("/status")
def status():
    fire_detected = random.choice([True, False])
    return jsonify({"fire": fire_detected})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
