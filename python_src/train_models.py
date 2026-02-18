
import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, LSTM, Dropout, Input, RepeatVector, TimeDistributed

# Import local preprocessing
try:
    from preprocessing import load_data, preprocess_data
except ImportError:
    # Fallback if running as script
    from python_src.preprocessing import load_data, preprocess_data

MODELS_DIR = "models"
os.makedirs(MODELS_DIR, exist_ok=True)

def train_random_forest(X_train, y_train):
    print("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    
    # Save model
    joblib.dump(rf, os.path.join(MODELS_DIR, "random_forest.pkl"))
    print("Random Forest saved.")
    return rf

def train_autoencoder(X_train):
    print("Training Autoencoder...")
    input_dim = X_train.shape[1]
    
    # Autoencoder Architecture
    input_layer = Input(shape=(input_dim,))
    encoder = Dense(32, activation="relu")(input_layer)
    encoder = Dense(16, activation="relu")(encoder)
    decoder = Dense(32, activation="relu")(encoder)
    decoder = Dense(input_dim, activation="sigmoid")(decoder)
    
    autoencoder = Model(inputs=input_layer, outputs=decoder)
    autoencoder.compile(optimizer='adam', loss='mean_squared_error')
    
    # Train only on normal traffic for anomaly detection
    autoencoder.fit(X_train, X_train, epochs=10, batch_size=32, shuffle=True, verbose=1)
    
    # Save model
    autoencoder.save(os.path.join(MODELS_DIR, "autoencoder.h5"))
    print("Autoencoder saved.")
    return autoencoder

def train_lstm(X_train, y_train):
    print("Training LSTM...")
    # Reshape for LSTM [samples, time steps, features]
    # Here we treat each sample as a sequence of length 1 (simplified)
    X_train_reshaped = X_train.reshape((X_train.shape[0], 1, X_train.shape[1]))
    
    model = Sequential()
    model.add(LSTM(64, input_shape=(1, X_train.shape[1]), activation='relu', return_sequences=True))
    model.add(Dropout(0.2))
    model.add(LSTM(32, activation='relu'))
    model.add(Dropout(0.2))
    model.add(Dense(1, activation='sigmoid'))
    
    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
    model.fit(X_train_reshaped, y_train, epochs=10, batch_size=32, verbose=1)
    
    model.save(os.path.join(MODELS_DIR, "lstm.h5"))
    print("LSTM saved.")
    return model

if __name__ == "__main__":
    # Mock data generation for demonstration
    print("Generating mock data for demonstration...")
    X_mock = np.random.rand(1000, 41) # 41 features
    y_mock = np.random.randint(0, 2, 1000)
    
    rf_model = train_random_forest(X_mock, y_mock)
    ae_model = train_autoencoder(X_mock)
    lstm_model = train_lstm(X_mock, y_mock)
    
    print("All models trained and saved successfully.")
