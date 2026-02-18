
import numpy as np
import joblib
import os
import tensorflow as tf
from tensorflow.keras.models import load_model

MODELS_DIR = "models"

class IDSEngine:
    def __init__(self):
        self.rf_model = None
        self.autoencoder = None
        self.lstm_model = None
        self.load_models()

    def load_models(self):
        """Load trained models from disk"""
        try:
            rf_path = os.path.join(MODELS_DIR, "random_forest.pkl")
            if os.path.exists(rf_path):
                self.rf_model = joblib.load(rf_path)
                print("Random Forest loaded.")

            ae_path = os.path.join(MODELS_DIR, "autoencoder.h5")
            if os.path.exists(ae_path):
                self.autoencoder = load_model(ae_path)
                print("Autoencoder loaded.")

            lstm_path = os.path.join(MODELS_DIR, "lstm.h5")
            if os.path.exists(lstm_path):
                self.lstm_model = load_model(lstm_path)
                print("LSTM loaded.")
                
        except Exception as e:
            print(f"Error loading models: {e}")

    def predict_rf(self, features):
        if not self.rf_model:
            return None
        # Reshape single sample
        features = np.array(features).reshape(1, -1)
        prediction = self.rf_model.predict(features)
        return int(prediction[0])

    def detect_anomaly_ae(self, features, threshold=0.01):
        if not self.autoencoder:
            return None
        features = np.array(features).reshape(1, -1)
        reconstructed = self.autoencoder.predict(features)
        mse = np.mean(np.power(features - reconstructed, 2), axis=1)
        return bool(mse[0] > threshold), float(mse[0])

    def predict_lstm(self, features):
        if not self.lstm_model:
            return None
        # Reshape for LSTM [1, 1, features]
        features = np.array(features).reshape(1, 1, -1)
        prediction = self.lstm_model.predict(features)
        return float(prediction[0][0])

if __name__ == "__main__":
    engine = IDSEngine()
    
    # Mock feature vector
    sample_features = np.random.rand(41)
    
    print("RF Prediction:", engine.predict_rf(sample_features))
    print("AE Anomaly:", engine.detect_anomaly_ae(sample_features))
    print("LSTM Score:", engine.predict_lstm(sample_features))
