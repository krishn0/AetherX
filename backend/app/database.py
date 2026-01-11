import motor.motor_asyncio
import os

# Using localhost for development as requested
MONGO_DETAILS = "mongodb://localhost:27017"

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
db = client.aetherx_db

# Collections
resources_collection = db.get_collection("resources")
zones_collection = db.get_collection("zones")
population_collection = db.get_collection("population")
cities_collection = db.get_collection("cities")
