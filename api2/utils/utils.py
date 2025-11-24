import os
from fastapi import APIRouter, HTTPException, Query
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
@router.get("/api/games/join")
async def join_latest_game(
    userId: str = Query(None, description="MongoDB _id of user"),
    email: str = Query(None, description="Fallback email if userId not provided"),
    ball: str = Query(..., description="Ball number")
):
    """
    Join the latest not started game using userId (preferred) or email and ball.
    """
    try:
        # 1️⃣ Fetch the latest "Not Started" game
        latest_game = await db.games.find_one({"status": "Not Started"}, sort=[("createdAt", -1)])
        if not latest_game:
            raise HTTPException(status_code=404, detail="No not started game found")

        # 2️⃣ Fetch user (by userId or email)
        user = None
        if userId:
            user = await db.users.find_one({"_id": ObjectId(userId)})
        elif email:
            user = await db.users.find_one({"email": email})

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 3️⃣ Check if user already joined
        for participant in latest_game.get("participants", []):
            if (
                (userId and participant.get("userId") == str(user["_id"])) or
                (email and participant.get("email") == user.get("email"))
            ):
                raise HTTPException(status_code=400, detail="User already joined the game")
        # calculate users total points
        user_stats = await db.users.find_one({"_id": ObjectId(userId)})
        points = user_stats.get("points", []) if user_stats else []
        total_points = sum(p["points"] for p in points if isinstance(p["points"], (int, float)))
        # 4️⃣ Add user to participants
        participant_data = {
            "userId": str(user["_id"]),
            "points": total_points,
            "username": user.get("username", "Unknown"),
            "pfp": user.get("pfp", ""),
            "ball": ball
        }

        # Keep backward compatibility (include email if exists)
        if user.get("email"):
            participant_data["email"] = user["email"]

        await db.games.update_one(
            {"_id": latest_game["_id"]},
            {"$addToSet": {"participants": participant_data}}
        )

        latest_game["_id"] = str(latest_game["_id"])
        return {"message": "Successfully joined the game", "game": latest_game}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error joining game: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")