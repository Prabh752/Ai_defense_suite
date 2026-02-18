
import pickle
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
import os

class DetectionEngine:
    def __init__(self):
        self.rf_model = None
        self.autoencoder = None
        self.lstm_model = None
        self.load_models()

    def load_models(self):
        """Load trained models from disk."""
        try:
            if os.path.exists("models/random_forest.pkl"):
                with open("models/random_forest.pkl", "rb") as f:
                    self.rf_model = pickle.load(f)
                print("Random Forest loaded.")
            
            if os.path.exists("models/autoencoder.keras"):
                self.autoencoder = load_model("models/autoencoder.keras")
                print("Autoencoder loaded.")
                
            if os.path.exists("models/lstm.keras"):
                self.lstm_model = load_model("models/lstm.keras")
                print("LSTM loaded.")
        except Exception as e:
            print(f"Error loading models: {e}")

    def predict_packet(self, features):
        """
        Predict if a packet is anomalous using all available models.
        Features: A single row of preprocessed features (numpy array).
        """
        results = {}
        
        # 1. Random Forest Prediction
        if self.rf_model:
            rf_pred = self.rf_model.predict(features.reshape(1, -1))[0]
            rf_prob = self.rf_model.predict_proba(features.reshape(1, -1))[0][1]
            results['random_forest'] = {
                'is_anomaly': bool(rf_pred == 1),
                'confidence': float(rf_prob)
            }
            
        # 2. Autoencoder Prediction (Reconstruction Error)
        if self.autoencoder:
            reconstructed = self.autoencoder.predict(features.reshape(1, -1), verbose=0)
            mse = np.mean(np.power(features - reconstructed, 2), axis=1)[0]
            # Threshold needs to be determined during training, using arbitrary 0.1 here
            threshold = 0.1 
            results['autoencoder'] = {
                'is_anomaly': bool(mse > threshold),
                'confidence': float(min(mse * 10, 1.0)), # Scaling for demo
                'reconstruction_error': float(mse)
            }
            
        # 3. LSTM Prediction
        if self.lstm_model:
            # Reshape for LSTM [1, 1, features]
            lstm_input = features.reshape(1, 1, features.shape[0])
            lstm_prob = self.lstm_model.predict(lstm_input, verbose=0)[0][0]
            results['lstm'] = {
                'is_anomaly': bool(lstm_prob > 0.5),
                'confidence': float(lstm_prob)
            }
            
        return results

if __name__ == "__main__":
    # Test the engine
    engine = DetectionEngine()
    
    # Create a dummy feature vector (41 features matching NSL-KDD minus label)
    # Note: This must match the preprocessed feature count (which varies after OneHotEncoding)
    # Since our mock preprocessing script does simple LabelEncoding, it stays 41 (minus label = 40? No 41 cols total, 1 is label)
    dummy_features = np.random.rand(38) # Approx size after drops
    
    # We need to know exact shape from training to test here, 
    # but let's assume the user runs train_models.py first which prints shape.
    print("Detection Engine initialized. Waiting for traffic...")
