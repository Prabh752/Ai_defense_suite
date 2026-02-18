
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Dense, LSTM, Input, Dropout
from python_src.preprocessing.data_preprocessing import load_data, preprocess_data

# Ensure directories exist
os.makedirs("models", exist_ok=True)

def train_random_forest(X_train, y_train, X_test, y_test):
    print("\n=== Training Random Forest ===")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train, y_train)
    
    y_pred = rf.predict(X_test)
    print("Random Forest Accuracy:", accuracy_score(y_test, y_pred))
    print(classification_report(y_test, y_pred))
    
    with open("models/random_forest.pkl", "wb") as f:
        pickle.dump(rf, f)
    print("Random Forest model saved to models/random_forest.pkl")
    return rf

def train_autoencoder(X_train, X_test):
    print("\n=== Training Autoencoder ===")
    # Autoencoder trains only on NORMAL traffic to learn to reconstruct it
    # But here we pass mixed data for simplicity of the script structure
    
    input_dim = X_train.shape[1]
    
    input_layer = Input(shape=(input_dim,))
    encoder = Dense(32, activation="relu")(input_layer)
    encoder = Dense(16, activation="relu")(encoder)
    decoder = Dense(32, activation="relu")(encoder)
    output_layer = Dense(input_dim, activation="sigmoid")(decoder)
    
    autoencoder = Model(inputs=input_layer, outputs=output_layer)
    autoencoder.compile(optimizer='adam', loss='mean_squared_error')
    
    autoencoder.fit(X_train, X_train, 
                    epochs=5, 
                    batch_size=32, 
                    shuffle=True, 
                    validation_data=(X_test, X_test),
                    verbose=1)
    
    autoencoder.save("models/autoencoder.keras")
    print("Autoencoder model saved to models/autoencoder.keras")
    return autoencoder

def train_lstm(X_train, y_train, X_test, y_test):
    print("\n=== Training LSTM ===")
    # Reshape for LSTM [samples, time steps, features]
    # Here we treat each sample as a sequence of 1 time step
    X_train_reshaped = X_train.values.reshape((X_train.shape[0], 1, X_train.shape[1]))
    X_test_reshaped = X_test.values.reshape((X_test.shape[0], 1, X_test.shape[1]))
    
    model = Sequential()
    model.add(LSTM(64, input_shape=(1, X_train.shape[1]), return_sequences=True))
    model.add(Dropout(0.2))
    model.add(LSTM(32))
    model.add(Dropout(0.2))
    model.add(Dense(1, activation='sigmoid'))
    
    model.compile(loss='binary_crossentropy', optimizer='adam', metrics=['accuracy'])
    
    model.fit(X_train_reshaped, y_train, epochs=5, batch_size=32, validation_data=(X_test_reshaped, y_test), verbose=1)
    
    loss, accuracy = model.evaluate(X_test_reshaped, y_test)
    print(f"LSTM Accuracy: {accuracy}")
    
    model.save("models/lstm.keras")
    print("LSTM model saved to models/lstm.keras")
    return model

if __name__ == "__main__":
    # Load and Preprocess
    df = load_data("data/raw/KDDTrain+.txt")
    X, y, scaler, encoders = preprocess_data(df)
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train Models
    train_random_forest(X_train, y_train, X_test, y_test)
    train_autoencoder(X_train, X_test)
    train_lstm(X_train, y_train, X_test, y_test)
    
    print("\nAll models trained and saved successfully.")
