import asyncio
import sys
import os

# Put backend on path
sys.path.append(os.getcwd())

from app.ml.resource_allocation import AllocationEngine, Resource, DisasterZone, Location
from app.api.chatbot import client

async def test_allocation():
    print("Testing Allocation Engine with AI...")
    
    if not client:
        print("Wait: Groq Client is NOT initialized in chatbot.py context. Test might fail.")
    else:
        print("Groq Client detected.")

    engine = AllocationEngine()
    
    # Mock Data
    resources = [
        Resource(id="R1", type="Ambulance", location=Location(lat=28.7, lng=77.1), capacity=4, specialization=["Medical"]),
        Resource(id="R2", type="Rescue Team", location=Location(lat=28.6, lng=77.2), capacity=10, specialization=["Disaster Response"])
    ]
    
    zones = [
        DisasterZone(id="Z1", type="Earthquake", severity=8, location=Location(lat=28.7, lng=77.1), affected_population=5000, vulnerability_score=0.9),
        DisasterZone(id="Z2", type="Flood", severity=5, location=Location(lat=19.0, lng=72.8), affected_population=1000, vulnerability_score=0.5)
    ]
    
    print("\nRunning allocation...")
    plan = engine.allocate(resources, zones)
    
    print("\n--- Plan Result ---")
    print(f"Total Allocations: {len(plan.allocations)}")
    print(f"AI Rationale: {plan.ai_rationale}")
    
    if "AI Rationale not available" in plan.ai_rationale or "AI Unavailable" in plan.ai_rationale:
        print("\n[FAIL] AI did not generate a rationale.")
    else:
        print("\n[SUCCESS] AI generated a rationale.")

if __name__ == "__main__":
    # Ensure we are in backend root
    if "backend" not in os.getcwd():
        print("Please run from backend directory")
        exit(1)
        
    asyncio.run(test_allocation())
