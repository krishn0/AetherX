import asyncio
import os
import sys

# Ensure backend directory is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import client

async def verify_connection():
    print(f"Attempting to connect to MongoDB Atlas...")
    try:
        # The ismaster command is cheap and does not require auth.
        # The 'ping' command is what we really want to check connectivity.
        await client.admin.command('ping')
        print("✅ SUCCESS: Connected to MongoDB Atlas!")
        
        # Optional: Print server info to be sure
        server_info = await client.server_info()
        print(f"Server version: {server_info.get('version')}")
        
    except Exception as e:
        print(f"❌ FAILED: Could not connect to MongoDB Atlas.")
        print(f"Error: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(verify_connection())
