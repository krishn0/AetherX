from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AetherX Disaster Management"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_FOR_DEV" # In prod, get from env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/aetherx"
    
    # CORS - Update these origins for production
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]

    # AI
    gemini_api_key: str = ""
    groq_api_key: str = ""

    model_config = SettingsConfigDict(env_file=[".env", "backend/.env"], extra="ignore")

settings = Settings()
