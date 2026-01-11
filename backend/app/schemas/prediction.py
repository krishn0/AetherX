from pydantic import BaseModel
from typing import Optional

class PredictionRequest(BaseModel):
    disaster_type: str
    severity_index: float
    economic_loss_usd: float
    casualties: int
    response_time_hours: float

class PredictionResponse(BaseModel):
    risk_level: str
    confidence_score: Optional[float] = None

class ForecastRequest(BaseModel):
    year: int
    month: int

class ForecastResponse(BaseModel):
    predicted_count: int
