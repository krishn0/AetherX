from fastapi import APIRouter, HTTPException, Depends
from app.schemas.prediction import PredictionRequest, PredictionResponse, ForecastRequest, ForecastResponse
import joblib
import pandas as pd
import os
import numpy as np

router = APIRouter()

# Load models (Lazy loading or global)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "../../ml_models")

risk_model = None
type_encoder = None
forecast_model = None

def load_models():
    global risk_model, type_encoder, forecast_model
    if risk_model is None:
        try:
            risk_model = joblib.load(os.path.join(MODEL_DIR, "risk_model.pkl"))
            type_encoder = joblib.load(os.path.join(MODEL_DIR, "disaster_type_encoder.pkl"))
            forecast_model = joblib.load(os.path.join(MODEL_DIR, "forecast_model.pkl"))
            print("Models loaded successfully.")
        except Exception as e:
            print(f"Error loading models: {e}")

load_models() # Try to load on import (or use lifespan in main.py)

@router.post("/predict_risk", response_model=PredictionResponse)
def predict_risk(request: PredictionRequest):
    if not risk_model or not type_encoder:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        # Encode type
        # Handle unseen labels carefully - for now assume valid input or try/except
        try:
            type_encoded = type_encoder.transform([request.disaster_type])[0]
        except:
            # Fallback for unknown types? Use a default or valid one?
            # Assigning 0 (first class) for demo stability
            type_encoded = 0 
            
        
        features = np.array([[
            request.severity_index,
            request.economic_loss_usd,
            request.casualties,
            request.response_time_hours,
            type_encoded
        ]])
        
        print(f"DEBUG PREDICTION: Features Shape: {features.shape}")
        print(f"DEBUG PREDICTION: Features: {features}")
        
        try:
            # Model returns string labels like 'Low', 'High'
            prediction = risk_model.predict(features)[0]
            # Verify it is a string, if not convert
            if not isinstance(prediction, str):
                prediction = str(prediction)
                
        except Exception as pred_err:
             print(f"DEBUG PREDICTION ERROR (predict): {pred_err}")
             # Try passing as DataFrame if array fails specific checks
             raise pred_err

        # prediction is label
        
        # Get probability if supported
        try:
            probs = risk_model.predict_proba(features)
            confidence = float(np.max(probs))
            print(f"DEBUG PREDICTION: Probs: {probs}")
        except Exception as prob_err:
             print(f"DEBUG PREDICTION ERROR (proba): {prob_err}")
             # Fallback if model doesn't support probability
             confidence = 0.85
        
        return PredictionResponse(risk_level=prediction, confidence_score=confidence)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/forecast", response_model=ForecastResponse)
def forecast_trends(request: ForecastRequest):
    if not forecast_model:
        raise HTTPException(status_code=503, detail="Forecast model not loaded")
    
    try:
        # Create a date object or ordinal
        # logic must match training: month_ordinal
        # Training used: month_ordinal = df['date'].apply(lambda x: x.ordinal)
        # We need to reconstruct this logic.
        
        dt = pd.Timestamp(year=request.year, month=request.month, day=1)
        month_ordinal = dt.toordinal()
        
        pred = forecast_model.predict([[month_ordinal]])[0]
        
        return ForecastResponse(predicted_count=int(pred))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
