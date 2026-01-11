import asyncio
from app.ml.resource_allocation import AllocationEngine, Resource, DisasterZone, Location

async def test_allocation():
    print("--- TRIGGERING DEBUG ALLOCATION ---")
    engine = AllocationEngine()
    
    # Mock Data
    resources = [
        Resource(id="RES-1", type="NDRF Rescue Team", location=Location(lat=28.0, lng=77.0), capacity=10, status="Available", specialization=["Disaster Response"], speed_kmh=80),
        Resource(id="RES-2", type="Medical Unit", location=Location(lat=28.1, lng=77.1), capacity=5, status="Available", specialization=["Medical"], speed_kmh=60)
    ]
    
    zones = [
        DisasterZone(id="ZONE-1", type="Flood", severity=8, location=Location(lat=28.05, lng=77.05), affected_population=1000, vulnerability_score=0.8, required_resources={})
    ]
    
    print(f"Testing with {len(resources)} Resources and {len(zones)} Zones")
    
    try:
        plan = engine.allocate(resources, zones)
        print(f"Plan Result: {len(plan.allocations)} allocations")
        for a in plan.allocations:
            print(f"  - Allocated {a.resource_id} to {a.zone_id}")
    except Exception as e:
        print(f"CRASH: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_allocation())
