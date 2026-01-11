import pandas as pd
import numpy as np
import os

# Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "../../global_disaster_response_2018_2024.csv")
PROCESSED_DATA_FILE = os.path.join(BASE_DIR, "processed_disasters.csv")

def load_and_clean_data():
    if not os.path.exists(DATA_FILE):
        print(f"Error: Data file not found at {DATA_FILE}")
        return

    print("Loading data...")
    df = pd.read_csv(DATA_FILE)

    # 1. Date Processing
    df['date'] = pd.to_datetime(df['date'])
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month

    # 2. Missing Values (if any - though dataset looks clean, good to be safe)
    df['casualties'] = df['casualties'].fillna(0)
    df['economic_loss_usd'] = df['economic_loss_usd'].fillna(0.0)

    # 3. Feature Engineering: Risk Score (Simplified for demo)
    # Risk factor = (Severity * 0.4) + (Casualties Norm * 0.3) + (Loss Norm * 0.3)
    # We normalize arbitrarily for this synthetic metric
    
    max_casualties = df['casualties'].max()
    max_loss = df['economic_loss_usd'].max()
    
    df['risk_score'] = (
        (df['severity_index'] / 10.0 * 0.4) + 
        (df['casualties'] / max_casualties * 0.3) + 
        (df['economic_loss_usd'] / max_loss * 0.3)
    )
    
    # Bucket Risk Level
    # 0-0.3: Low, 0.3-0.6: Medium, 0.6-1.0: High
    conditions = [
        (df['risk_score'] <= 0.3),
        (df['risk_score'] > 0.3) & (df['risk_score'] <= 0.6),
        (df['risk_score'] > 0.6)
    ]
    choices = ['Low', 'Medium', 'High']
    df['risk_level'] = np.select(conditions, choices, default='Medium')

    print(f"Data processed successfully. Shape: {df.shape}")
    print(df.head())

    # Save processed data
    df.to_csv(PROCESSED_DATA_FILE, index=False)
    print(f"Saved processed data to {PROCESSED_DATA_FILE}")

if __name__ == "__main__":
    load_and_clean_data()
