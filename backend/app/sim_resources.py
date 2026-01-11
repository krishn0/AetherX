import random
import asyncio
from app.ml.resource_allocation import AllocationEngine, Resource, DisasterZone, Location
from app.database import resources_collection, zones_collection, population_collection, cities_collection

# No global lists anymore - using DB

import math

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

async def get_simulation_data(max_distance: int = 5000):
    """
    Fetches resources and zones from MongoDB.
    Applies SERVER-SIDE PROXIMITY FILTERING to reduce frontend lag.
    Only returns resources within max_distance km of an active disaster zone.
    """
    # Fetch Zones first
    zones = []
    cursor = zones_collection.find({})
    async for doc in cursor:
        zones.append(DisasterZone(
            id=doc['id'],
            type=doc['type'],
            severity=doc['severity'],
            location=Location(**doc['location']),
            affected_population=doc['affected_population'],
            vulnerability_score=doc['vulnerability_score'],
            status=doc.get('status', 'Active') # Default to Active
        ))

    # Fetch Resources
    resources = []
    cursor = resources_collection.find({})
    async for doc in cursor:
        # Optimization: Don't create full Pydantic object yet, check distance first
        r_loc = doc['location']
        
        # Check if near ANY zone
        is_relevant = False
        for z in zones:

            dist = haversine_distance(r_loc['lat'], r_loc['lng'], z.location.lat, z.location.lng)
            if dist <= max_distance: # Configurable proximity filter
                is_relevant = True
                break
        
        if is_relevant:
            resources.append(Resource(
                id=doc['id'],
                type=doc['type'],
                location=Location(**r_loc),
                capacity=doc['capacity'],
                status=doc['status'],
                specialization=doc['specialization'],
                speed_kmh=doc.get('speed_kmh', 80)
            ))

    return resources, zones

async def add_resource(resource: Resource):
    """
    Persists a new resource to MongoDB.
    """
    doc = {
        "id": resource.id,
        "type": resource.type,
        "location": {"lat": resource.location.lat, "lng": resource.location.lng},
        "capacity": resource.capacity,
        "status": resource.status,
        "specialization": resource.specialization,
        "speed_kmh": resource.speed_kmh
    }
    await resources_collection.insert_one(doc)
    return resource

async def add_zone(zone: DisasterZone):
    """
    Persists a new disaster zone to MongoDB.
    """
    doc = {
        "id": zone.id,
        "type": zone.type,
        "severity": zone.severity,
        "location": {"lat": zone.location.lat, "lng": zone.location.lng},
        "affected_population": zone.affected_population,
        "vulnerability_score": zone.vulnerability_score,
        "status": getattr(zone, 'status', 'Active')
    }
    await zones_collection.insert_one(doc)
    return zone

async def delete_resource(resource_id: str):
    """
    Removes a resource from MongoDB.
    """
    result = await resources_collection.delete_one({"id": resource_id})
    return result.deleted_count > 0

async def delete_resources_bulk(resource_ids: list[str]):
    """
    Removes multiple resources efficiently.
    """
    if not resource_ids:
        return 0
    result = await resources_collection.delete_many({"id": {"$in": resource_ids}})
    return result.deleted_count


async def delete_zone(zone_id: str):
    """
    Removes a disaster zone from MongoDB.
    """
    result = await zones_collection.delete_one({"id": zone_id})
    return result.deleted_count > 0

async def update_resource_status(resource_id: str, new_status: str):
    """
    Updates the status of a resource in MongoDB.
    """
    result = await resources_collection.update_one(
        {"id": resource_id},
        {"$set": {"status": new_status}}
    )
    return result.modified_count > 0

async def update_zone_status(zone_id: str, new_status: str):
    """
    Updates the status of a disaster zone in MongoDB.
    """
    result = await zones_collection.update_one(
        {"id": zone_id},
        {"$set": {"status": new_status}}
    )
    return result.modified_count > 0

# Legacy run_simulation not strictly needed for web app but kept for structure
async def run_simulation():
    print("--- Starting Resource Allocation Simulation (MongoDB) ---")
    
    # 1. Setup
    engine = AllocationEngine()
    resources, zones = await get_simulation_data()
    
    print(f"Fetched {len(resources)} Resources and {len(zones)} Disaster Zones from DB.")
    
    if not resources:
        print("No resources found. Run seed_db.py first.")
        return

    # 2. Run Allocation
    print("\nRunning Allocation Engine...")
    plan = engine.allocate(resources, zones)
    
    # 3. Output Results
    print(f"\nAllocation Complete in {plan.computation_time_ms}ms")
    print(f"Total Utility Score: {plan.total_score}")
    print(f"Allocations Made: {len(plan.allocations)}")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_simulation())

async def clear_simulation_data():
    """
    Deletes all resources and zones from MongoDB.
    """
    await resources_collection.delete_many({})
    await zones_collection.delete_many({})
    return True

async def seed_simulation_data():
    """
    Seeds the database with random disaster zones and resources for a fresh simulation.
    """
    import uuid
    import random
    
    # 1. Clear existing
    await clear_simulation_data()
    
    # 2. Add Random Zones
    disaster_types = ["Flood", "Cyclone", "Earthquake", "Heat Wave"]
    # Bounding box roughly covering India
    indi_lat_min, indi_lat_max = 8.0, 35.0
    indi_lng_min, indi_lng_max = 68.0, 97.0
    
    zones_to_add = []
    
    for _ in range(random.randint(3, 8)):
        lat = random.uniform(indi_lat_min, indi_lat_max)
        lng = random.uniform(indi_lng_min, indi_lng_max)
        
        severity_map = {"Low": 3, "Medium": 5, "High": 8, "Critical": 10}
        sev_label = random.choice(["Low", "Medium", "High", "Critical"])
        
        zone = DisasterZone(
            id=f"ZONE-AUTO-{uuid.uuid4().hex[:6].upper()}",
            type=random.choice(disaster_types),
            location=Location(lat=lat, lng=lng),
            severity=severity_map[sev_label],
            affected_population=random.randint(500, 50000),
            vulnerability_score=random.random(),
            required_resources={}
        )
        await add_zone(zone)
        zones_to_add.append(zone)
        
    # 3. Add Resources near zones (and some scattered)
    resource_types = ["Ambulance", "Fire Truck", "Police", "NDRF Team", "Helicopter"]
    
    for _ in range(random.randint(10, 20)):
        # 70% chance to be near a zone
        if zones_to_add and random.random() < 0.7:
            target_zone = random.choice(zones_to_add)
            lat = target_zone.location.lat + (random.uniform(-1, 1))
            lng = target_zone.location.lng + (random.uniform(-1, 1))
        else:
            lat = random.uniform(indi_lat_min, indi_lat_max)
            lng = random.uniform(indi_lng_min, indi_lng_max)
            
        res_type = random.choice(resource_types)
        
        # Assign specializations based on type
        specializations = []
        if res_type == "Ambulance":
            specializations = ["Medical", "Emergency Response"]
        elif res_type == "Fire Truck":
            specializations = ["Fire", "Rescue"]
        elif res_type == "NDRF Team":
            specializations = ["Disaster Response", "Rescue", "Medical"]
        elif res_type == "Helicopter":
            specializations = ["Air Support", "Medical", "Rescue"]
        elif res_type == "Police":
            specializations = ["Security", "Evacuation"]
            
        res = Resource(
            id=f"RES-AUTO-{uuid.uuid4().hex[:6].upper()}",
            type=res_type,
            location=Location(lat=lat, lng=lng),
            capacity=random.randint(5, 50),
            status="Available",
            specialization=specializations,
            speed_kmh=random.randint(40, 100)
        )
        await add_resource(res)
    
    return True
