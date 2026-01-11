import asyncio
import csv
import os
import re
import sys

# Add project root to path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import resources_collection, zones_collection, population_collection, cities_collection, client

async def seed_data():
    print("--- Starting Database Seeding ---")
    
    # 1. Clear existing data
    await resources_collection.delete_many({})
    await zones_collection.delete_many({})
    await population_collection.delete_many({})
    await cities_collection.delete_many({})
    print("Cleared existing collections.")

    # 2. Seed Population
    pop_csv = "c:/CodeHere/TRY/dataset/population.csv"
    pop_data = []
    if os.path.exists(pop_csv):
        try:
            with open(pop_csv, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader) # Skip header
                for row in reader:
                    if len(row) > 2:
                        try:
                            city = row[1].strip()
                            # Clean "963,429[1]" -> 963429
                            pop_str = re.sub(r'\[.*?\]', '', row[2]).replace(',', '').replace('"', '').strip()
                            if pop_str.isdigit():
                                pop_data.append({
                                    "city": city,
                                    "city_lower": city.lower(),
                                    "population": int(pop_str)
                                })
                        except Exception:
                            continue
            if pop_data:
                await population_collection.insert_many(pop_data)
                print(f"Seeded {len(pop_data)} population records.")
        except Exception as e:
            print(f"Error seeding population: {e}")

    # 3. Seed Resources
    # Prefer large dataset, fallback to small
    res_csv = "c:/CodeHere/TRY/dataset/resources_10k.csv"
    if not os.path.exists(res_csv):
        res_csv = "c:/CodeHere/TRY/dataset/resources.csv"
    
    res_data = []
    if os.path.exists(res_csv):
        try:
            with open(res_csv, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    count += 1
                    specs = row['Specialization'].split('|') if row.get('Specialization') else []
                    res_data.append({
                        "_id": f"RES-CSV-{count:03d}", # Use custom ID
                        "id": f"RES-CSV-{count:03d}",
                        "type": row['Type'],
                        "location": {"lat": float(row['Lat']), "lng": float(row['Lng'])},
                        "capacity": int(row['Capacity']),
                        "status": row['Status'],
                        "specialization": specs,
                        "speed_kmh": 80
                    })
                    if len(res_data) >= 2000: # Batch insert for performance
                        await resources_collection.insert_many(res_data)
                        res_data = []
                
                # Insert remaining
                if res_data:
                    await resources_collection.insert_many(res_data)
                print(f"Seeded resources from {res_csv}")
        except Exception as e:
             print(f"Error seeding resources: {e}")

    # 4. Seed Cities (optional but good for lookups)
    city_csv = "c:/CodeHere/TRY/dataset/Indian Cities Database.csv"
    city_data = []
    if os.path.exists(city_csv):
        try:
             with open(city_csv, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        city_data.append({
                            "city": row['City'],
                            "lat": float(row['Lat']),
                            "lng": float(row['Long'])
                        })
                    except: continue
             if city_data:
                 await cities_collection.insert_many(city_data)
                 print(f"Seeded {len(city_data)} cities.")
        except Exception as e:
            print(f"Error seeding cities: {e}")

    print("--- Seeding Complete ---")
    client.close()

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_data())
