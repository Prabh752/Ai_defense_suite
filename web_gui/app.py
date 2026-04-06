
from flask import Flask, render_template, jsonify, request
import pandas as pd
import sys
import os

# Add parent directory to path to import python_src modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__, template_folder='templates', static_folder='static')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    # Here we would call the DetectionEngine from python_src
    # dummy response
    return jsonify({"status": "success", "prediction": "Normal"})

@app.route('/api/traffic-log')
def traffic_log():
    # Return dummy logs
    return jsonify([
        {"id": 1, "src_ip": "192.168.1.10", "dst_ip": "10.0.0.1", "protocol": "TCP", "info": "HTTP Request"},
        {"id": 2, "src_ip": "192.168.1.15", "dst_ip": "10.0.0.1", "protocol": "UDP", "info": "DNS Query"}
    ])

if __name__ == '__main__':
    port = int(os.environ.get("PORT", "5001"))
    print(f"Starting Flask GUI on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
