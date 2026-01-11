from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class WeatherData(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    condition: str

class DisasterFeedItem(BaseModel):
    id: str
    type: str
    location: str
    severity: str
    timestamp: datetime
    affected_population: Optional[int] = None

class Alert(BaseModel):
    id: str
    level: str
    message: str
    timestamp: datetime
    active: bool
