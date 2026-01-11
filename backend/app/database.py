import motor.motor_asyncio
import os

from app.core.config import settings

# Using settings for connection
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URI)
db = client.aetherx_db

# Collections
resources_collection = db.get_collection("resources")
zones_collection = db.get_collection("zones")
population_collection = db.get_collection("population")
cities_collection = db.get_collection("cities")
