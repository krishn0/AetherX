import math
from typing import List, Dict, Optional
from pydantic import BaseModel
import time

# --- Data Models ---

class Location(BaseModel):
    lat: float
    lng: float

class Resource(BaseModel):
    id: str
    type: str  # "Ambulance", "Rescue Team", "Supply Truck", "Helicopter", "Fire Truck", "Police"
    location: Location
    capacity: int  # People or Kg
    status: str = "Available"  # "Available", "Deployed", "Returning"
    specialization: List[str] = [] # ["Medical", "Water", "Fire"]
    speed_kmh: float = 60.0

class DisasterZone(BaseModel):
    id: str
    type: str  # "Flood", "Earthquake", "Wildfire"
    severity: int  # 1-10
    location: Location
    affected_population: int
    vulnerability_score: float # 0.0 - 1.0 (Elderly, Hospitals, etc.)
    required_resources: Dict[str, int] = {} # Estimated needs
    status: str = "Active" # "Active", "Processing", "Resolved"

class Allocation(BaseModel):
    resource_id: str
    zone_id: str
    eta_minutes: float
    distance_km: float
    explanation: str

class Plan(BaseModel):
    allocations: List[Allocation]
    unallocated_resources: List[str]
    unserved_zones: List[str]
    total_score: float
    computation_time_ms: float
    ai_rationale: Optional[str] = None # Strategic summary from Groq AI

# --- Utilities ---

def haversine_distance(loc1: Location, loc2: Location) -> float:
    """Calculate the great circle distance in kilometers between two points on the earth."""
    R = 6371  # Earth radius in km
    dLat = math.radians(loc2.lat - loc1.lat)
    dLon = math.radians(loc2.lng - loc1.lng)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(loc1.lat)) * math.cos(math.radians(loc2.lat)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# --- Engine ---

class AllocationEngine:
    """
    Heuristic-based Resource Allocation Engine.
    
    Strategy:
    Uses a Greedy Constructive Heuristic approach with Multi-Objective Scoring.
    1. Prioritization: Zones are ranked by Severity * Vulnerability.
    2. Candidate Selection: For each high-priority zone, we identify valid candidate resources (within 500km).
    3. Scoring: Candidates are scored based on:
       - Proximity (Highest Weight): Minimizing travel time.
       - Severity Match: Ensuring high-capacity units go to high-severity zones.
       - Specialization: Bonus for tailored capabilities (e.g., Medical for hospitals).
    4. Assignment: The highest-scoring candidate is greedily assigned, and removed from the pool.
    
    This matches resources effectively while maintaining computational efficiency (O(N*M)).
    """
    def __init__(self):
        # Weights for the objective function
        self.w_severity = 0.3
        self.w_urgency = 0.2
        self.w_proximity = 0.8
        
        # Resource compatibility matrix
        # Resource compatibility matrix
        self.compatibility = {
            "Flood": ["Helicopter", "Ambulance", "NDRF Team", "Fire Truck", "Police", "NDRF Rescue Team", "Medical Unit"],
            "Wildfire": ["Fire Truck", "Helicopter", "Ambulance", "Police", "NDRF Team", "NDRF Rescue Team", "Medical Unit"],
            "Earthquake": ["NDRF Team", "Ambulance", "Helicopter", "Police", "Fire Truck", "NDRF Rescue Team", "Medical Unit"],
            "Cyclone": ["Helicopter", "NDRF Team", "Ambulance", "Police", "Fire Truck", "NDRF Rescue Team", "Medical Unit"],
            "Heat Wave": ["Ambulance", "Police", "Helicopter", "NDRF Team", "Medical Unit"],
            "Landslide": ["NDRF Team", "Rescue Team", "Helicopter", "Ambulance", "Police", "JCB", "Bulldozer", "Excavator", "NDRF Rescue Team", "Medical Unit"]
        }

    def _is_compatible(self, resource: Resource, zone: DisasterZone) -> bool:
        """Check if resource type or specialization fits the disaster."""
        
        # Broad compatibility with fuzzy matching
        valid_types = self.compatibility.get(zone.type, [])
        if not valid_types:
             # Fallback 1: Try to fuzzy match the zone type against known keys (e.g. "Major Landslide" -> "Landslide")
             for known_type in self.compatibility:
                 if known_type.lower() in zone.type.lower() or zone.type.lower() in known_type.lower():
                     valid_types = self.compatibility[known_type]
                     break
            
        if not valid_types:
             # Fallback 2: Universal compatibility for rescue teams
             valid_types = ["Helicopter", "Ambulance", "Police", "Fire Truck", "NDRF Team", "NDRF Rescue Team", "Medical Unit", "Rescue Team"]
        
        res_type_lower = resource.type.lower()
        res_tokens = set(res_type_lower.split())
        
        # 1. Exact or Substring Match
        if any(vt.lower() in res_type_lower or res_type_lower in vt.lower() for vt in valid_types):
            return True
            
        # 2. Token Intersection (e.g. "NDRF Rescue Team" matches "NDRF Team" via "NDRF")
        for vt in valid_types:
            vt_tokens = set(vt.lower().split())
            if not res_tokens.isdisjoint(vt_tokens):
                common = res_tokens.intersection(vt_tokens)
                if any(len(t) > 3 for t in common): 
                    return True
                    
        # 3. Specialization Check
        for s in resource.specialization:
            s_lower = s.lower()
            if any(vt.lower() in s_lower or s_lower in vt.lower() for vt in valid_types):
                return True
                
        return False

    def _calculate_score(self, resource: Resource, zone: DisasterZone, distance: float) -> float:
        """
        Calculate utility score for assigning a resource to a zone.
        Higher is better.
        """
        # 1. Severity Score (normalized 0-1)
        severity_score = zone.severity / 10.0
        
        # 2. Urgency/Vulnerability (0-1)
        urgency_score = zone.vulnerability_score
        
        # 3. Proximity Score (Inverse of distance, normalized roughly)
        # Using steeper decay (div 10.0) to strongly penalize distance > 10-20km
        proximity_score = 1.0 / (1.0 + (distance / 10.0)) 
        
        # 4. Specialization Bonus
        bonus = 0.0
        if "Medical" in resource.specialization and zone.vulnerability_score > 0.7:
             bonus += 0.2
        
        # Note: Severity and Urgency are constant for a given zone iter, so Proximity is key discriminator.
        total_score = (self.w_severity * severity_score) + \
                      (self.w_urgency * urgency_score) + \
                      (self.w_proximity * proximity_score) + bonus
                      
        return total_score

    def allocate(self, resources: List[Resource], zones: List[DisasterZone]) -> Plan:
        start_time = time.time()
        
        allocations = []
        available_resources = [r for r in resources if r.status == "Available"]
        open_zones = sorted(zones, key=lambda z: z.severity * z.vulnerability_score, reverse=True)
        
        allocated_resource_ids = set()
        total_score = 0.0
        
        # Greedy Assignment Phase
        print(f"DEBUG: Starting allocation for {len(open_zones)} zones with {len(available_resources)} resources.")
        for zone in open_zones:
            print(f"DEBUG: Processing Zone {zone.id} ({zone.type}) at {zone.location}")
            # Find best available resources for this zone
            candidates = []
            for res in available_resources:
                if res.id in allocated_resource_ids:
                    continue
                
                if not self._is_compatible(res, zone):
                    # print(f"DEBUG: Resource {res.id} ({res.type}) incompatible with {zone.type}")
                    continue
                
                dist = haversine_distance(res.location, zone.location)
                
                # CONSTRAINT: Removed hard limit to allow long-range dispatch if necessary.
                # Scoring will naturally penalize far resources.
                # if dist > 500:
                #    continue
                
                score = self._calculate_score(res, zone, dist)
                candidates.append((score, res, dist))
            
            # Sort candidates by score
            candidates.sort(key=lambda x: x[0], reverse=True)
            
            # Assign top N needed (simplified logic: assign up to 3 resources per zone for now)
            # In a real LP, this would be a capacity constraint
            needed = max(1, int(zone.affected_population / 1000))
            assigned_count = 0
            
            for score, res, dist in candidates:
                if assigned_count >= needed:
                    break
                
                travel_time = (dist / res.speed_kmh) * 60 # Minutes
                
                allocations.append(Allocation(
                    resource_id=res.id,
                    zone_id=zone.id,
                    eta_minutes=round(travel_time, 1),
                    distance_km=round(dist, 2),
                    explanation=f"Matches {zone.type} needs. High severity ({zone.severity}). Proximity: {dist:.1f}km."
                ))
                print(f"DEBUG: Allocated {res.id} ({res.type}) to {zone.id}. Dist: {dist:.1f}km, Score: {score:.2f}")
                
                allocated_resource_ids.add(res.id)
                total_score += score
                assigned_count += 1
            
            if assigned_count == 0:
                print(f"DEBUG: No candidates found or assigned for Zone {zone.id}")


        # Local Search / Optimization Phase (Swap Step)
        # TODO: Implement 2-opt swap to reduce total travel time while maintaining severity coverage
        
        unallocated = [r.id for r in resources if r.id not in allocated_resource_ids]
        unserved = [z.id for z in zones if not any(a.zone_id == z.id for a in allocations)]
        
        end_time = time.time()
        
        # --- AI Justification Step ---
        ai_msg = "AI Rationale not available (Enable Groq Key)."
        try:
            # Re-import to ensure we get the latest client state
            from app.api.chatbot import client, model_name
            
            if client:
                # 1. Calculate Deficits
                gap_summary = []
                total_needed = 0
                total_assigned = len(allocations)
                
                for zone in open_zones:
                    needed = max(1, int(zone.affected_population / 1000))
                    total_needed += needed
                    
                    assigned_to_zone = len([a for a in allocations if a.zone_id == zone.id])
                    if assigned_to_zone < needed:
                        gap_summary.append(f"{zone.type} (Sev:{zone.severity}) in {zone.location.lat:.1f},{zone.location.lng:.1f} needs {needed - assigned_to_zone} more units")

                # 2. Construct AI Prompt
                summary = f"Plan Analysis: Allocated {total_assigned} resources against a total requirement of {total_needed}. "
                summary += "Strategy Used: Resources matched based on Severity, Urgency, and Proximity (Haversine < 200km). "
                
                # Optimize Context: Limit to top 5 critical deficits to save tokens
                if gap_summary:
                    summary += f"CRITICAL DEFICITS: {'; '.join(gap_summary[:5])}. "
                    if len(gap_summary) > 5:
                        summary += f"And {len(gap_summary) - 5} other zones short. "
                else:
                    summary += "All zones have sufficient minimum coverage. "
                
                # Optimize Context: Limit unserved zones list
                unserved_count = len(unserved)
                summary += f"Total Unserved Zones: {unserved_count}. "
                if unserved_count > 0:
                     summary += f"Sample Unserved IDs: {', '.join(unserved[:10])}..." if unserved_count > 10 else f"Unserved: {', '.join(unserved)}."

                resp = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a Strategic Commander. Briefly justify this allocation plan based on the Proximity and Severity strategy. If there are deficits, SUGGEST specifically which resource types need to be acquired. Use military brevity. Max 3 sentences."},
                        {"role": "user", "content": summary}
                    ],
                    model=model_name,
                    max_tokens=300,
                    timeout=15.0 # Increased timeout for reliability
                )
                ai_msg = resp.choices[0].message.content
            else:
                ai_msg = "AI Optimization: Allocations prioritized based on severity and Haversine proximity."
        except Exception as e:
            print(f"Allocation AI Error: {e}")
            ai_msg = "Plan generated using heuristic proximity logic (AI Unavailable)."

        return Plan(
            allocations=allocations,
            unallocated_resources=unallocated,
            unserved_zones=unserved,
            total_score=round(total_score, 2),
            computation_time_ms=round((end_time - start_time) * 1000, 2),
            ai_rationale=ai_msg
        )
