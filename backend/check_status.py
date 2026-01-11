import asyncio
from app.database import resources_collection

async def check_status():
    print("--- CHECKING RESOURCE STATUS ---")
    resources = []
    cursor = resources_collection.find({})
    async for doc in cursor:
        resources.append(doc)
    
    print(f"Total Resources: {len(resources)}")
    available = [r for r in resources if r.get('status') == 'Available']
    deployed = [r for r in resources if r.get('status') == 'Deployed']
    
    print(f"Available: {len(available)}")
    print(f"Deployed: {len(deployed)}")
    
    today_zone = {"lat": 21.1, "lng": 77.2} # From user prompt
    
    print(f"\n--- Checking Proximity to Target {today_zone} ---")
    import math
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    for r in available:
        loc = r['location']
        dist = haversine(loc['lat'], loc['lng'], today_zone['lat'], today_zone['lng'])
        print(f" - {r['type']}: {dist:.1f} km away")

if __name__ == "__main__":
    asyncio.run(check_status())
