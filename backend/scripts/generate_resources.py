import csv
import random
import math

# Need to read CSV
import csv
import os

# Target: 1,000 entries
TARGET_COUNT = 1000

# Load Cities from CSV
cities = []
city_csv_path = "c:/CodeHere/TRY/dataset/Indian Cities Database.csv"

if os.path.exists(city_csv_path):
    try:
        with open(city_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # Column names based on user file: City,Lat,Long
                    c_name = row['City'].strip()
                    c_lat = float(row['Lat'])
                    c_lng = float(row['Long'])
                    # Assign a standard radius of 15km for these
                    cities.append((c_name, c_lat, c_lng, 15))
                except ValueError:
                    continue
        print(f"Loaded {len(cities)} cities from database.")
    except Exception as e:
        print(f"Error loading city DB: {e}. using fallbacks.")
else:
    print("City DB not found. Using fallbacks.")

# Fallback if CSV fails or is empty
if not cities:
    cities = [
        ("Mumbai", 19.0760, 72.8777, 15),
        ("Delhi", 28.7041, 77.1025, 20),
        ("Bangalore", 12.9716, 77.5946, 15),
        ("Chennai", 13.0827, 80.2707, 12),
        ("Hyderabad", 17.3850, 78.4867, 15),
        ("Kolkata", 22.5726, 88.3639, 12)
    ]

# Resource Distributions
resource_types = [
    {"type": "Ambulance", "weight": 40, "specs": ["Medical", "ICU", "Trauma"]},
    {"type": "Police", "weight": 30, "specs": ["Security", "Crowd Control", "Patrol"]},
    {"type": "Fire Truck", "weight": 15, "specs": ["Fire", "Rescue"]},
    {"type": "Supply Truck", "weight": 8, "specs": ["Food", "Water", "Medical Kits"]},
    {"type": "Rescue Team", "weight": 5, "specs": ["Flood", "Debris", "Mountain"]},
    {"type": "NDRF Team", "weight": 1, "specs": ["Disaster Response", "Chemical", "Structure Collapse"]},
    {"type": "Helicopter", "weight": 1, "specs": ["Airlift", "Survey", "Rescue"]}
]

def generate_random_point(lat, lng, radius_km):
    # Convert radius from km to degrees (approx)
    radius_in_degrees = radius_km / 111.0
    u = random.random()
    v = random.random()
    w = radius_in_degrees * math.sqrt(u)
    t = 2 * math.pi * v
    x = w * math.cos(t)
    y = w * math.sin(t)
    
    # Adjust longitude for latitude shrinking
    new_lat = lat + x
    new_lng = lng + (y / math.cos(math.radians(lat)))
    
    return round(new_lat, 6), round(new_lng, 6)

def generate_dataset():
    data = []
    
    # Header
    header = ["Type", "City", "Lat", "Lng", "Capacity", "Status", "Specialization"]
    data.append(header)
    
    generated_coords = set()
    count = 0
    
    while count < TARGET_COUNT:
        city_name, c_lat, c_lng, c_rad = random.choice(cities)
        
        # Pick Type based on weight
        r_choice = random.choices(resource_types, weights=[r['weight'] for r in resource_types], k=1)[0]
        r_type = r_choice['type']
        
        # Coords
        lat, lng = generate_random_point(c_lat, c_lng, c_rad)
        
        # Ensure Uniqueness
        if (lat, lng) in generated_coords:
            continue
        generated_coords.add((lat, lng))
        
        # Specs
        specs = random.sample(r_choice['specs'], k=random.randint(1, len(r_choice['specs'])))
        spec_str = "|".join(specs)
        
        # Capacity
        cap = random.randint(3, 15)
        if r_type == "Supply Truck": cap = random.randint(50, 200)
        if r_type == "NDRF Team": cap = 50
        if r_type == "Helicopter": cap = 5
        
        data.append([r_type, city_name, lat, lng, cap, "Available", spec_str])
        count += 1
        
    # Write CSV
    with open("c:/CodeHere/TRY/dataset/resources_10k.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(data)
        
    print(f"Successfully generated {TARGET_COUNT} unique resources in c:/CodeHere/TRY/dataset/resources_10k.csv")

if __name__ == "__main__":
    generate_dataset()
