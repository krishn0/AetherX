from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/")
def root():
    return {"message": "Welcome to AetherX Disaster Management API"}

from app.api import prediction, monitoring, resources, chatbot

app.include_router(prediction.router, prefix="/api/v1", tags=["prediction"])
app.include_router(monitoring.router, prefix="/api/v1/monitor", tags=["monitoring"])
app.include_router(resources.router, prefix="/api/v1/resources", tags=["resources"])
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["chatbot"])
