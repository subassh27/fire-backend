from flask import Flask, jsonify
from flask_cors import CORS
import random
import os

app = Flask(__name__)
CORS(app)

@app.route("/status")
def status():
    fire_detected = random.choice([True, False])
    return jsonify({"fire": fire_detected})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)