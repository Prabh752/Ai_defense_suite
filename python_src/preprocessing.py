
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
import os

# Define column names for NSL-KDD dataset
COL_NAMES = ["duration","protocol_type","service","flag","src_bytes",
    "dst_bytes","land","wrong_fragment","urgent","hot","num_failed_logins",
    "logged_in","num_compromised","root_shell","su_attempted","num_root",
    "num_file_creations","num_shells","num_access_files","num_outbound_cmds",
    "is_host_login","is_guest_login","count","srv_count","serror_rate",
    "srv_serror_rate","rerror_rate","srv_rerror_rate","same_srv_rate",
    "diff_srv_rate","srv_diff_host_rate","dst_host_count","dst_host_srv_count",
    "dst_host_same_srv_rate","dst_host_diff_srv_rate","dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate","dst_host_serror_rate","dst_host_srv_serror_rate",
    "dst_host_rerror_rate","dst_host_srv_rerror_rate","label","difficulty_level"]

def load_data(path):
    """
    Load NSL-KDD dataset
    """
    if not os.path.exists(path):
        print(f"Error: File not found at {path}")
        return None
    
    df = pd.read_csv(path, header=None, names=COL_NAMES)
    return df

def preprocess_data(df):
    """
    Preprocess the dataset:
    - Encode categorical variables
    - Scale numerical features
    - Split into labels and features
    """
    # Drop labels and difficulty level for features
    X = df.drop(['label', 'difficulty_level'], axis=1)
    y = df['label']
    
    # Binary classification: normal vs attack
    y = y.apply(lambda x: 0 if x == 'normal' else 1)
    
    # Categorical columns
    cat_cols = ['protocol_type', 'service', 'flag']
    
    # Label Encoding (for simplicity in this project)
    # In production, OneHotEncoding is preferred but increases dimensionality significantly
    le = LabelEncoder()
    for col in cat_cols:
        X[col] = le.fit_transform(X[col])
        
    # Scaling
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    return X_scaled, y, scaler, le

if __name__ == "__main__":
    # Example usage
    print("Preprocessing script loaded.")
    # df = load_data("data/raw/KDDTrain+.txt")
    # X, y, scaler, le = preprocess_data(df)
