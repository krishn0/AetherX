from fastapi import APIRouter, HTTPException
from typing import List, Dict
from app.ml.resource_allocation import AllocationEngine, Resource, DisasterZone, Location, Plan
from pydantic import BaseModel

router = APIRouter()
engine = AllocationEngine()

@router.post("/allocate", response_model=Plan)
def allocate_resources(resources: List[Resource], zones: List[DisasterZone]):
    """
    Allocates resources to disaster zones using a multi-objective heuristic algorithm.
    """
    try:
        print(f"DEBUG: Received allocation request. Resources: {len(resources)}, Zones: {len(zones)}")
        plan = engine.allocate(resources, zones)
        print(f"DEBUG: Allocation Plan generated. Allocations: {len(plan.allocations)}, Unserved: {len(plan.unserved_zones)}")
        return plan
    except Exception as e:
        print(f"ERROR: Allocation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from app.sim_resources import get_simulation_data, add_resource, clear_simulation_data, seed_simulation_data, update_resource_status
import uuid

@router.post("/simulation/start")
async def start_simulation():
    """
    Clears existing simulation data and seeds a new random scenario.
    """
    await seed_simulation_data()
    resources, zones = await get_simulation_data()
    return {"message": "Simulation started with new random scenario", "resources_count": len(resources), "zones_count": len(zones)}


@router.get("/simulation_data")
async def get_simulation_data_endpoint(max_distance: int = 5000):
    """
    Returns current snapshot of resources and zones for the Simulation/Operation Office.
    Optional max_distance parameter controls proximity filter (default: 200km).
    Use max_distance=9999 to see all resources regardless of distance.
    """
    resources, zones = await get_simulation_data(max_distance)
    return {"resources": resources, "zones": zones}

class ResourceCreate(BaseModel):
    type: str
    location: Location
    capacity: int
    status: str = "Available"
    specialization: List[str] = []
    speed_kmh: int = 60

@router.post("/resource")
async def create_resource(res: ResourceCreate):
    new_res = Resource(
        id=f"RES-{uuid.uuid4().hex[:8].upper()}",
        type=res.type,
        location=res.location,
        capacity=res.capacity,
        status=res.status,
        specialization=res.specialization,
        speed_kmh=res.speed_kmh
    )
    await add_resource(new_res)
    return {"message": "Resource created", "resource": new_res}

@router.get("/safe_areas")
def get_safe_areas():
    """
    Returns a list of safe areas in India.
    """
    return [
        {"id": "SAFE-001", "location": {"lat": 19.0760, "lng": 72.8777}, "capacity": 5000, "type": "Shelter - Mumbai"},
        {"id": "SAFE-002", "location": {"lat": 28.7041, "lng": 77.1025}, "capacity": 8000, "type": "Stadium - Delhi"},
        {"id": "SAFE-003", "location": {"lat": 13.0827, "lng": 80.2707}, "capacity": 6000, "type": "Hospital - Chennai"},
        {"id": "SAFE-004", "location": {"lat": 22.5726, "lng": 88.3639}, "capacity": 4000, "type": "Shelter - Kolkata"}
    ]


from app.sim_resources import update_resource_status, update_zone_status

@router.post("/dispatch")
async def dispatch_resources(plan: Plan):
    """
    Simulates dispatching resources and notifying teams/citizens.
    Updates resource status to 'Deployed'.
    Updates zone status to 'Processing'.
    """
    deployed_count = 0
    for allocation in plan.allocations:
        success = await update_resource_status(allocation.resource_id, "Deployed")
        if success:
            deployed_count += 1
    
    # Update status for all zones involved in the allocation
    # Use a set to update each zone only once
    for zone_id in set(a.zone_id for a in plan.allocations):
        await update_zone_status(zone_id, "Processing")
            
    return {
        "status": "success",
        "message": f"Dispatched {deployed_count} teams. Status updated to 'Deployed'. Zone status updated to 'Processing'. SMS alerts sent.",
        "dispatched_count": deployed_count
    }

from app.sim_resources import add_zone
import random

class DisasterCreate(BaseModel):
    type: str
    location: Location
    severity: str

@router.post("/disaster")
async def create_disaster_endpoint(disaster: DisasterCreate):
    """
    Injects a new disaster zone into the simulation.
    """
    severity_map = {"Low": 3, "Medium": 5, "High": 8, "Critical": 10}
    sev_val = severity_map.get(disaster.severity, 5)
    
    new_zone = DisasterZone(
        id=f"ZONE-MANUAL-{uuid.uuid4().hex[:6].upper()}",
        type=disaster.type,
        location=disaster.location,
        severity=sev_val,
        affected_population=random.randint(1000, 100000), # Simulation estimate
        vulnerability_score=random.random(),
        required_resources={}
    )
    await add_zone(new_zone)
    return {"message": "Disaster injected into simulation", "zone": new_zone}

class ReinforceRequest(BaseModel):
    zone_ids: List[str]

@router.post("/reinforce")
async def reinforce_zones(request: ReinforceRequest):
    """
    Spawns 'NDRF' reinforcement units near specified unserved zones.
    """
    resources_added = []
    
    # Needs to fetch current zones to get location
    current_resources, current_zones = await get_simulation_data()
    target_zones = [z for z in current_zones if z.id in request.zone_ids]
    
    for zone in target_zones:
        # Spawn 3 units per unserved zone
        for i in range(3):
            # Random offset ~5km
            lat_offset = (random.random() - 0.5) * 0.05
            lng_offset = (random.random() - 0.5) * 0.05
            
            res_type = random.choice(["NDRF Rescue Team", "Medical Unit", "Helicopter"])
            
            new_res = Resource(
                id=f"RES-NDRF-{uuid.uuid4().hex[:4].upper()}",
                type=res_type,
                location=Location(lat=zone.location.lat + lat_offset, lng=zone.location.lng + lng_offset),
                capacity=50,
                status="Available",
                specialization=["Disaster Response", "Medical"] if "Medical" in res_type else ["Disaster Response"],
                speed_kmh=80
            )
            await add_resource(new_res)
            resources_added.append(new_res)

    return {
        "message": f"Deployed {len(resources_added)} reinforcement units to {len(target_zones)} critical zones.",
        "added_count": len(resources_added)
    }

from app.sim_resources import delete_resource, delete_zone

@router.delete("/resource/{resource_id}")
async def delete_resource_endpoint(resource_id: str):
    """
    Removes a resource from the simulation.
    """
    success = await delete_resource(resource_id)
    if not success:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {"message": "Resource removed"}

class BulkDeleteRequest(BaseModel):
    resource_ids: List[str]

from app.sim_resources import delete_resources_bulk

@router.post("/resource/bulk_delete")
async def bulk_delete_resources(request: BulkDeleteRequest):
    """
    Removes multiple resources in one request.
    """
    count = await delete_resources_bulk(request.resource_ids)
    return {"message": f"Removed {count} resources", "deleted_count": count}

@router.delete("/disaster/{zone_id}")
async def delete_disaster_endpoint(zone_id: str):
    """
    Removes a disaster zone from the simulation.
    """
    success = await delete_zone(zone_id)
    if not success:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {"message": "Disaster zone removed"}
