import os
from fastapi import APIRouter, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId

load_dotenv()

router = APIRouter()

# MongoDB setup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pinballrace_com")

mongo = AsyncIOMotorClient(MONGO_URI)
db = mongo[DB_NAME]

@router.get("/api/games/fetch")
async def fetch_games_from_db():
    """
    Fetch game data directly from MongoDB (used by frontend).
    Returns: list of all games, sorted by createdAt descending.
    """
    try:
        games_cursor = db.games.find({}, {
            "_id": 0,  # hide Mongo _id for frontend cleanliness
            "status": 1,
            "gameType": 1,
            "gameNumber": 1,
            "timerTillNextGame": 1,
            "participants": 1,
            "entry": 1,
            "prizeId": 1,
            "prizeTitle": 1,
            "createdAt": 1
        }).sort("createdAt", -1)

        games = await games_cursor.to_list(length=None)

        if not games:
            return {"games": []}

        return {"games": games}

    except Exception as e:
        print(f"❌ Error fetching games: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

#using email and ball to join the latest not started game
@router.post("/api/games/join")
async def join_latest_game(email: str, ball: str):
    """
    Join the latest not started game using email and ball.
    """
    try:
        latest_game = await db.games.find_one({
            "status": "Not Started"
        }, sort=[("createdAt", -1)])

        if not latest_game:
            raise HTTPException(status_code=404, detail="No not started game found")

        # Add user to the game
        await db.games.update_one({"_id": latest_game["_id"]}, {
            "$addToSet": {
                "participants": {
                    "email": email,
                    "ball": ball
                }
            }
        })
        latest_game["_id"] = str(latest_game["_id"])

        return {"message": "Successfully joined the game", "game": latest_game}

    except Exception as e:
        print(f"❌ Error joining game: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")