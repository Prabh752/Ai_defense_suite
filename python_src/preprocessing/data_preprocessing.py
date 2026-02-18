
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import os

# Define column names for NSL-KDD dataset
COLUMNS = [
    'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
    'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins',
    'logged_in', 'num_compromised', 'root_shell', 'su_attempted', 'num_root',
    'num_file_creations', 'num_shells', 'num_access_files', 'num_outbound_cmds',
    'is_host_login', 'is_guest_login', 'count', 'srv_count', 'serror_rate',
    'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 'same_srv_rate',
    'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count',
    'dst_host_srv_count', 'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
    'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate',
    'dst_host_serror_rate', 'dst_host_srv_serror_rate',
    'dst_host_rerror_rate', 'dst_host_srv_rerror_rate', 'label'
]

def load_data(path):
    """
    Load NSL-KDD dataset.
    If file doesn't exist, generate synthetic data for demonstration.
    """
    if os.path.exists(path):
        print(f"Loading data from {path}...")
        return pd.read_csv(path, names=COLUMNS)
    else:
        print(f"Warning: {path} not found. Generating synthetic data for demonstration...")
        return generate_synthetic_data()

def generate_synthetic_data(n_samples=1000):
    """Generate synthetic data mimicking NSL-KDD structure."""
    data = {}
    for col in COLUMNS[:-1]:
        data[col] = np.random.rand(n_samples)
    
    # Categorical columns
    data['protocol_type'] = np.random.choice(['tcp', 'udp', 'icmp'], n_samples)
    data['service'] = np.random.choice(['http', 'ftp', 'smtp', 'private'], n_samples)
    data['flag'] = np.random.choice(['SF', 'S0', 'REJ'], n_samples)
    
    # Label
    data['label'] = np.random.choice(['normal', 'neptune', 'satan', 'ipsweep', 'portsweep'], n_samples)
    
    return pd.DataFrame(data)

def preprocess_data(df):
    """
    Preprocess the dataset:
    1. Encode categorical features.
    2. Normalize numerical features.
    3. Split into X (features) and y (labels).
    """
    # Copy data to avoid modifying original
    data = df.copy()
    
    # Encode categorical features
    cat_cols = ['protocol_type', 'service', 'flag']
    encoders = {}
    for col in cat_cols:
        le = LabelEncoder()
        data[col] = le.fit_transform(data[col])
        encoders[col] = le
        
    # Encode labels
    # Binary classification for IDS (Normal vs Attack) usually, or Multi-class
    # Here we map 'normal' to 0 and everything else to 1 for binary classification base
    data['label_binary'] = data['label'].apply(lambda x: 0 if x == 'normal' else 1)
    
    # Normalize numerical features
    scaler = MinMaxScaler()
    num_cols = [c for c in COLUMNS if c not in cat_cols + ['label', 'label_binary']]
    data[num_cols] = scaler.fit_transform(data[num_cols])
    
    X = data.drop(['label', 'label_binary'], axis=1)
    y = data['label_binary']
    
    return X, y, scaler, encoders

if __name__ == "__main__":
    # Test the preprocessing
    df = load_data("data/raw/KDDTrain+.txt")
    X, y, scaler, encoders = preprocess_data(df)
    print("Data Preprocessing Complete.")
    print(f"Features shape: {X.shape}")
    print(f"Labels shape: {y.shape}")
