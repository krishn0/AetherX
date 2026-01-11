import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# ../../data/processed_disasters.csv
DATA_PATH = os.path.join(BASE_DIR, "../../data/processed_disasters.csv")
MODEL_DIR = os.path.join(BASE_DIR, "../../ml_models")

def train_models():
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
        
    print("Loading processed data...")
    if not os.path.exists(DATA_PATH):
        print("Processed data not found. Please run process_data.py first.")
        return

    df = pd.read_csv(DATA_PATH)
    
    # --- 1. RISK PREDICTION MODEL (Classification) ---
    print("\nTraining Risk Prediction Model...")
    
    # Features: severity_index, economic_loss_usd, casualties, response_time_hours
    # We will also encode 'disaster_type'
    
    le_type = LabelEncoder()
    df['disaster_type_encoded'] = le_type.fit_transform(df['disaster_type'])
    
    # Target: risk_level
    X = df[['severity_index', 'economic_loss_usd', 'casualties', 'response_time_hours', 'disaster_type_encoded']]
    y = df['risk_level']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Risk Model Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred))
    
    # Save Model & Encoder
    joblib.dump(clf, os.path.join(MODEL_DIR, "risk_model.pkl"))
    joblib.dump(le_type, os.path.join(MODEL_DIR, "disaster_type_encoder.pkl"))
    print("Risk Classifier Saved.")
    
    # --- 2. FORECASTING MODEL (Regression for Trend) ---
    # We'll try to predict 'disaster_count' for next month based on historical monthly aggregation
    print("\nTraining Forecasting Model...")
    
    # Aggregate by Year-Month
    df['date'] = pd.to_datetime(df['date'])
    monthly_data = df.groupby(df['date'].dt.to_period('M')).size().reset_index(name='count')
    monthly_data['month_ordinal'] = monthly_data['date'].apply(lambda x: x.ordinal)
    
    # Features: month_ordinal (Trend over time)
    # Target: count
    
    X_f = monthly_data[['month_ordinal']]
    y_f = monthly_data['count']
    
    X_f_train, X_f_test, y_f_train, y_f_test = train_test_split(X_f, y_f, test_size=0.2, random_state=42, shuffle=False)
    
    reg = RandomForestRegressor(n_estimators=100, random_state=42)
    reg.fit(X_f_train, y_f_train)
    
    y_f_pred = reg.predict(X_f_test)
    mse = mean_squared_error(y_f_test, y_f_pred)
    print(f"Forecasting MSE: {mse:.4f}")
    
    joblib.dump(reg, os.path.join(MODEL_DIR, "forecast_model.pkl"))
    print("Forecasting Model Saved.")

if __name__ == "__main__":
    train_models()
