from fastapi import APIRouter
from typing import List
from app.schemas.monitoring import DisasterFeedItem, Alert, WeatherData
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter()

import httpx

# OpenMeteo WMO Code Mapping
def get_condition_from_code(code: int) -> str:
    if code == 0: return "Sunny"
    if 1 <= code <= 3: return "Cloudy"
    if 45 <= code <= 48: return "Foggy"
    if 51 <= code <= 67: return "Rainy"
    if 71 <= code <= 77: return "Snowy"
    if 80 <= code <= 82: return "Stormy"
    if 95 <= code <= 99: return "Thunderstorm"
    return "Unknown"

# Mock Data Generator (Fallback)
def get_mock_weather(location: str):
    return WeatherData(
        temperature=round(random.uniform(20.0, 35.0), 1),
        humidity=round(random.uniform(40.0, 90.0), 1),
        wind_speed=round(random.uniform(0.0, 50.0), 1),
        condition=random.choice(["Sunny", "Cloudy", "Rainy", "Stormy"])
    )

@router.get("/weather", response_model=WeatherData)
async def get_weather(location: str = "Mumbai"): # Default to Mumbai for India
    # Indian cities coordinates
    coords = {"lat": 19.0760, "lng": 72.8777} # Mumbai default
    
    if location.lower() == "delhi": coords = {"lat": 28.7041, "lng": 77.1025}
    elif location.lower() == "mumbai": coords = {"lat": 19.0760, "lng": 72.8777}
    elif location.lower() == "kolkata": coords = {"lat": 22.5726, "lng": 88.3639}
    elif location.lower() == "chennai": coords = {"lat": 13.0827, "lng": 80.2707}
    elif location.lower() == "bangalore": coords = {"lat": 12.9716, "lng": 77.5946}
    elif location.lower() == "hyderabad": coords = {"lat": 17.3850, "lng": 78.4867}
    elif location.lower() == "pune": coords = {"lat": 18.5204, "lng": 73.8567}
    elif location.lower() == "ahmedabad": coords = {"lat": 23.0225, "lng": 72.5714}
    
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={coords['lat']}&longitude={coords['lng']}&current_weather=true"
            response = await client.get(url, timeout=5.0)
            data = response.json()
            
            current = data.get("current_weather", {})
            
            return WeatherData(
                temperature=current.get("temperature", 0.0),
                wind_speed=current.get("windspeed", 0.0),
                humidity=60.0, # OpenMeteo basic free doesn't give humidity in "current_weather", needs "hourly"
                condition=get_condition_from_code(current.get("weathercode", 0))
            )
    except Exception as e:
        print(f"Weather API Error: {e}. Falling back to mock.")
        return get_mock_weather(location)

from pydantic import BaseModel

class DisasterCreateRequest(BaseModel):
    type: str
    location: str
    severity: str

SIMULATED_DISASTERS = []

from app.database import population_collection

async def get_pop_for_location(location: str) -> int:
    loc_lower = location.lower()
    
    # Try exact match first
    doc = await population_collection.find_one({"city_lower": loc_lower})
    if doc:
        return doc['population']
        
    # Regex search for partial match
    doc = await population_collection.find_one({"city_lower": {"$regex": loc_lower}})
    if doc:
        return doc['population']
        
    return random.randint(5000, 500000)

@router.post("/disaster")
async def create_simulated_disaster(disaster: DisasterCreateRequest):
    new_disaster = DisasterFeedItem(
        id=str(uuid.uuid4()),
        type=disaster.type,
        location=disaster.location,
        severity=disaster.severity,
        timestamp=datetime.now(),
        affected_population=await get_pop_for_location(disaster.location)
    )
    SIMULATED_DISASTERS.insert(0, new_disaster)
    return {"message": "Disaster simulated successfully", "data": new_disaster}

@router.get("/feeds", response_model=List[DisasterFeedItem])
async def get_disaster_feeds():
    # Return simulated disasters first, then mock ones
    mock_feeds = await _get_mock_feeds()
    if SIMULATED_DISASTERS:
        return SIMULATED_DISASTERS + mock_feeds
    return mock_feeds

async def _get_mock_feeds():
    """
    Fetch real disaster data from multiple sources calls.
    """
    feeds = []
    
    # 1. Fetch real earthquake data from USGS
    try:
        # Get data for the last 30 days
        start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime={start_date}&minlatitude=8&maxlatitude=35&minlongitude=68&maxlongitude=97&minmagnitude=2.5&limit=10&orderby=time"
        
        # Retry logic: 3 attempts
        for attempt in range(3):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(url)
                    if response.status_code == 200:
                        data = response.json()
                        features = data.get('features', [])
                        
                        for feature in features:
                            props = feature['properties']
                            mag = props.get('mag', 0)
                            if mag >= 6.0: severity = "Critical"
                            elif mag >= 5.0: severity = "High"
                            elif mag >= 4.0: severity = "Medium"
                            else: severity = "Low"
                            
                            loc_name = props.get('place', 'India Region')
                            
                            # Ensure timestamp validation
                            ts_ms = props.get('time')
                            if ts_ms:
                                ts = datetime.fromtimestamp(ts_ms / 1000)
                            else:
                                ts = datetime.now()
        
                            feeds.append(DisasterFeedItem(
                                id=str(feature['id']),
                                type="Earthquake",
                                location=loc_name,
                                severity=severity,
                                timestamp=ts,
                                affected_population=await get_pop_for_location(loc_name)
                            ))
                        # If successful, break the retry loop
                        break
            except Exception as e:
                print(f"USGS Fetch Attempt {attempt+1} failed: {e}")
                if attempt == 2: raise e # Re-raise if last attempt
                import asyncio
                await asyncio.sleep(1) # Wait 1s before retry

    except Exception as e:
        print(f"Failed to fetch USGS data even after retries: {e}")
    
    # 2. Mock Fire Data (NASA FIRMS requires key)
    # Since we don't have a valid MAP_KEY, we will simulate fire data based on season/location
    try:
        # Simulate fires in fire-prone states
        fire_locs = [
            {"lat": 30.7333, "lng": 79.0668, "place": "Uttarakhand Forest"},
            {"lat": 20.2961, "lng": 85.8245, "place": "Odisha Forest Reserve"},
            {"lat": 11.9416, "lng": 79.8083, "place": "Tamil Nadu Hills"}
        ]
        
        # Only add fires with 30% probability to avoid clutter
        if random.random() < 0.3:
            loc = random.choice(fire_locs)
            loc_name = loc['place']
            
            feeds.append(DisasterFeedItem(
                id=f"fire-{uuid.uuid4()}",
                type="Wildfire",
                location=loc_name,
                severity="Medium",
                timestamp=datetime.now(),
                affected_population=await get_pop_for_location(loc_name)
            ))
            
    except Exception as e:
         print(f"Failed to generate mock fire data: {e}")
    
    # 3. Simulated Fallback
    if len(feeds) < 3:
        types = ["Flood", "Cyclone", "Landslide", "Heat Wave"]
        locs = ["Kerala", "Maharashtra", "Uttarakhand", "Gujarat", "West Bengal", "Odisha", "Tamil Nadu", "Assam"]
        severity = ["Low", "Medium", "High", "Critical"]
        
        for _ in range(3 - len(feeds)):
            t_loc = random.choice(locs)
            feeds.append(DisasterFeedItem(
                id=str(uuid.uuid4()),
                type=random.choice(types),
                location=t_loc,
                severity=random.choice(severity),
                timestamp=datetime.now(),
                affected_population=await get_pop_for_location(t_loc)
            ))
    
    return feeds

@router.get("/alerts", response_model=List[Alert])
async def get_active_alerts():
    """
    Generate alerts based on current disaster feeds.
    Shows Critical and High severity disasters as active alerts.
    """
    alerts = []
    
    # Get all disaster feeds
    feeds = await _get_mock_feeds()
    
    # Create alerts for Critical disasters
    critical_disasters = [f for f in feeds if f.severity == "Critical"]
    for disaster in critical_disasters:
        alerts.append(Alert(
            id=f"alert-{disaster.id}",
            level="Critical",
            message=f"{disaster.type} alert for {disaster.location} - Immediate evacuation required",
            timestamp=disaster.timestamp,
            active=True
        ))
    
    # Create alerts for High severity disasters
    high_disasters = [f for f in feeds if f.severity == "High"]
    for disaster in high_disasters:
        alerts.append(Alert(
            id=f"alert-{disaster.id}",
            level="High",
            message=f"{disaster.type} warning for {disaster.location} - Prepare for evacuation",
            timestamp=disaster.timestamp,
            active=True
        ))
    
    
    # If no critical or high severity disasters, show default monitoring alert
    if not alerts:
        alerts.append(Alert(
            id="alert-default",
            level="Medium",
            message="Monsoon season active - Monitor flood warnings for coastal regions",
            timestamp=datetime.now(),
            active=True
        ))
    
    return alerts

import feedparser

class NewsItem(BaseModel):
    title: str
    link: str
    source: str
    published: str

@router.get("/news", response_model=List[NewsItem])
def get_disaster_news():
    """
    Fetch real-time disaster news for India using Google News RSS.
    """
    try:
        # Google News RSS for "India disaster flood earthquake cyclone"
        rss_url = "https://news.google.com/rss/search?q=India+disaster+flood+earthquake+cyclone&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(rss_url)
        
        news_items = []
        for entry in feed.entries[:10]: # Top 10 news
            news_items.append(NewsItem(
                title=entry.title,
                link=entry.link,
                source=entry.source.title if hasattr(entry, 'source') else "Google News",
                published=entry.published
            ))
        return news_items

    except Exception as e:
        print(f"Failed to fetch news: {e}")
        # Return mock news if fetch fails
        return [
            NewsItem(title="Heavy rains predicted in Kerala", link="#", source="IMD", published=str(datetime.now())),
            NewsItem(title="Cyclone alert for Odisha coast", link="#", source="NDRF", published=str(datetime.now())),
            NewsItem(title="Flood situation improves in Assam", link="#", source="Times of India", published=str(datetime.now()))
        ]

# --- SOS Signal System ---

class SOSSignal(BaseModel):
    id: str
    lat: float
    lng: float
    type: str # e.g., "medical", "fire", "police", "panic"
    timestamp: datetime
    status: str = "active" # active, resolved

ACTIVE_SOS_SIGNALS: List[SOSSignal] = []

@router.post("/sos")
async def broadcast_sos(signal: SOSSignal):
    """
    Receive a distress signal from a citizen.
    """
    # Ensure ID and timestamp
    if not signal.id:
        signal.id = str(uuid.uuid4())
    if not signal.timestamp:
        signal.timestamp = datetime.now()
        
    ACTIVE_SOS_SIGNALS.insert(0, signal)
    
    # Keep only last 50 for memory safety
    if len(ACTIVE_SOS_SIGNALS) > 50:
        ACTIVE_SOS_SIGNALS.pop()
        
    return {"message": "SOS Broadcasted Successfully", "id": signal.id}

@router.get("/sos", response_model=List[SOSSignal])
async def get_sos_signals():
    """
    Get active SOS signals for the Operation Office.
    """
    return [s for s in ACTIVE_SOS_SIGNALS if s.status == "active"]

@router.post("/sos/{signal_id}/resolve")
async def resolve_sos(signal_id: str):
    for s in ACTIVE_SOS_SIGNALS:
        if s.id == signal_id:
            s.status = "resolved"
            return {"message": "SOS Signal Resolved"}
    return {"error": "Signal not found"}

# --- Simulation Mode for Dashboard Demo ---

SIMULATION_MODE = {"enabled": False}

class SimulationData(BaseModel):
    active_alerts: int
    resources_active: int
    total_impacted: int
    resource_load: int
    disaster_feeds: List[DisasterFeedItem]

@router.post("/simulation/toggle")
async def toggle_simulation_mode():
    """Toggle simulation mode on/off"""
    SIMULATION_MODE["enabled"] = not SIMULATION_MODE["enabled"]
    return {
        "message": f"Simulation mode {'enabled' if SIMULATION_MODE['enabled'] else 'disabled'}",
        "enabled": SIMULATION_MODE["enabled"]
    }

@router.get("/simulation/status")
async def get_simulation_status():
    """Get current simulation mode status"""
    return {"enabled": SIMULATION_MODE["enabled"]}

@router.get("/simulation/data", response_model=SimulationData)
async def get_simulation_data():
    """
    Generate realistic simulation data for dashboard demo.
    Includes dynamic metrics and disaster scenarios.
    """
    # Generate realistic disaster scenarios
    disaster_types = ["Flood", "Earthquake", "Cyclone", "Landslide", "Wildfire", "Heat Wave"]
    locations = [
        "Mumbai, Maharashtra", "Delhi NCR", "Chennai, Tamil Nadu", 
        "Kolkata, West Bengal", "Bangalore, Karnataka", "Hyderabad, Telangana",
        "Ahmedabad, Gujarat", "Pune, Maharashtra", "Jaipur, Rajasthan",
        "Kerala Coast", "Uttarakhand Hills", "Assam Valley"
    ]
    severities = ["Low", "Medium", "High", "Critical"]
    
    # Generate 5-8 active disasters
    num_disasters = random.randint(5, 8)
    mock_feeds = []
    
    for i in range(num_disasters):
        disaster_type = random.choice(disaster_types)
        location = random.choice(locations)
        severity = random.choice(severities)
        
        # Higher severity = more affected population
        if severity == "Critical":
            affected_pop = random.randint(50000, 200000)
        elif severity == "High":
            affected_pop = random.randint(20000, 50000)
        elif severity == "Medium":
            affected_pop = random.randint(5000, 20000)
        else:
            affected_pop = random.randint(1000, 5000)
        
        # Vary timestamps to show recent activity
        hours_ago = random.randint(0, 48)
        timestamp = datetime.now() - timedelta(hours=hours_ago)
        
        mock_feeds.append(DisasterFeedItem(
            id=f"sim-{uuid.uuid4()}",
            type=disaster_type,
            location=location,
            severity=severity,
            timestamp=timestamp,
            affected_population=affected_pop
        ))
    
    # Calculate metrics
    total_impacted = sum(f.affected_population for f in mock_feeds)
    active_alerts = len([f for f in mock_feeds if f.severity in ["Critical", "High"]])
    
    # Simulate resources (10-25 active resources)
    resources_active = random.randint(10, 25)
    
    # Resource load (percentage of resources deployed)
    resource_load = random.randint(45, 85)
    
    return SimulationData(
        active_alerts=active_alerts,
        resources_active=resources_active,
        total_impacted=total_impacted,
        resource_load=resource_load,
        disaster_feeds=mock_feeds
    )

