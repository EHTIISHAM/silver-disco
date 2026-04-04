from fastapi import APIRouter, HTTPException, Query
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import json
import asyncio
from dotenv import load_dotenv
import os
from TikTokLive import TikTokLiveClient

load_dotenv()
router = APIRouter()

MONGO_URL = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pinballrace_com")

mongo = AsyncIOMotorClient(MONGO_URL)
db = mongo[DB_NAME]

# HELPER FUNTIONS
# to get the remaining time for the race to start tkaing from bakcend and getting the time json fetch and pass the time
# to tell if client is live or not via URL tiktok
# to return total players joind last race mongodb
# to total live races played mongodb
# to send the sponcer details json fetch and pass details

# we could use a json file to store to get the stored time and the spencer details
# they contain the time in utc timestamp
#sponcer name and logo in base64 format

# File paths
ADMIN_CONFIG_FILE = os.path.join("utils", "admin_config.json")

# In-memory cache for ultra-fast API responses
landing_page_cache = {
    "next_race_time": None,
    "is_live": False,
    "last_race_players": 0,
    "total_races": 0,
    "max_offline_race":5,
    "sponsors": []
}

async def is_admin_live() -> bool:
    """
    Checks if a specific TikTok user is currently live.
    Returns True if live, False if offline or not found.
    """
    # Initialize the client with the admin's username (can be with or without the '@')
    client = TikTokLiveClient(unique_id="@pinballrace")
    
    try:
        # retrieve_room_info fetches the live room status from TikTok's backend
        # without actually connecting your server to the live chat websocket.
        islive = await client.is_live()
        
    except Exception as e:
        print(e)
        return False
    
    return islive

async def get_db_stats():
    """Fetches total races and players from the last race in MongoDB."""
    try:
        total_races = await db["games"].count_documents({"status": "Finished"})
        
        last_race = await db["games"].find_one(
            {"status": "Finished"}, 
            sort=[("createdAt", -1)]
        )
        
        last_race_players = len(last_race.get("participants", [])) if last_race else 0
        
        return total_races, last_race_players
    except Exception as e:
        print(f"DB Error: {e}")
        return 0, 0

async def get_admin_config():
    """Reads the local JSON config AND checks TikTok live status."""
    config_data = {
        "next_race_time": None,
        "tiktok_live_url": None,
        "is_live": False,
        "sponsors": []
    }

    # 1. Read from the JSON file
    try:
        if os.path.exists(ADMIN_CONFIG_FILE):
            with open(ADMIN_CONFIG_FILE, "r") as f:
                file_data = json.load(f)
                config_data.update(file_data)
    except Exception as e:
        print(f"Config read error: {e}")

    # 2. Call your async TikTok function directly (no HTTP request needed!)
    try:
        live_status = await is_admin_live()
        config_data["is_live"] = live_status
    except Exception as e:
        print(f"Failed to check TikTok status: {e}")

    return config_data
# --- BACKGROUND REFRESH TASK ---

async def refresh_landing_data():
    """Background loop that updates the cache every 5 minutes (300 seconds)."""
    global landing_page_cache
    max_offline_race = str(os.getenv("MAX_OFFLINE_GAMES_PER_DAY",5))
    while True:
        try:
            # 1. Fetch live DB stats
            total_races, last_race_players = await get_db_stats()
            
            # 2. Fetch admin configurations
            admin_data = await get_admin_config()
            
            # 3. Compile the combined payload
            updated_data = {
                "next_race_time": admin_data.get("next_race_time"),
                "is_live": admin_data.get("is_live", False),
                "tiktok_live_url": admin_data.get("tiktok_live_url"),
                "last_race_players": last_race_players,
                "total_races": total_races,
                "sponsors": admin_data.get("sponsors", []),
                "max_offline_race": max_offline_race,
                "last_updated": datetime.utcnow().isoformat()
            }
            
            # 4. Update the in-memory cache (Instant for API reads)
            landing_page_cache.update(updated_data)
            
                
            print("Landing page data refreshed successfully.")
            
        except Exception as e:
            print(f"Error refreshing landing data: {e}")
            
        # Wait 5 minutes before running again
        await asyncio.sleep(5)

# --- STARTUP EVENT ---

@router.on_event("startup")
async def startup_event():
    """Starts the background task when the FastAPI server spins up."""
    # Attempt to load from JSON first in case the server just restarted
    global landing_page_cache
    # Spin up the asynchronous background loop
    asyncio.create_task(refresh_landing_data())

# --- API ENDPOINT ---

@router.get("/landing")
async def get_landing_data():
    """
    Returns the cached landing page data in a single call.
    No DB queries are executed here, making it incredibly fast.
    """
    if not landing_page_cache:
        raise HTTPException(status_code=503, detail="Cache warming up, please try again in a moment.")
    
    return landing_page_cache

@router.get("/timer_data")
async def get_landing_data():
    """
    Returns the cached landing page data in a single call.
    No DB queries are executed here, making it incredibly fast.
    """
    if not landing_page_cache:
        raise HTTPException(status_code=503, detail="Cache warming up, please try again in a moment.")
    
    return {"timer":landing_page_cache["next_race_time"]}