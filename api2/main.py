# THIS APP WILL HANDLE ADMIN PROFILE REQUESTS 
# FROM DASHBOARD ADMIN CAN LOGIN THROUGHT THIS API VERIFICATION WILL BE DONE
# RAW PASSWORD WILL BE STORED ALONGSIDE THE NAME AND HASH TOKEN IN ENV FILE
# HASED PASSWORD WILL BE USED FOR VERIFICATION PURPOSES
# THE DASHBOARD DATA WILL BE FETCHED FROM THIS API ONLY
# SENT TO THE ALREADY EXISTING PINBALLRACE_COM MONGO DB DATABASE
# IT WILL HANDLE GAMES/PRIZES/PLAYERS DATA FORM DASHBOARD

# main.py
import os
import uuid
import base64
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from bson import ObjectId
from fastapi import FastAPI, Request, Form, Response, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.hash import bcrypt
from pydantic import BaseModel
from dotenv import load_dotenv

from utils.utils import router as utils_router


load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pinballrace_com")
SECRET_KEY = os.getenv("SECRET_KEY", "supersecret")
SESSION_EXPIRE_SECONDS = int(os.getenv("SESSION_EXPIRE_SECONDS", "86400"))

POS_POINT = { "1": 25, "2": 10, "3": 5, "4": 1, "5": 1 , "6": 1, "7": 1, "8": 1, "9": 1, "10": 1 }

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://pinballrace.com",
        "https://www.pinballrace.com",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
app.include_router(utils_router)

templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mongo client
mongo = AsyncIOMotorClient(MONGO_URI)
db = mongo[DB_NAME]

# ---------- Utilities ----------
async def get_next_sequence( name: str) -> int:
    """Auto-increment counter that resets daily."""
    today = datetime.utcnow().strftime("%Y-%m-%d")

    # Use a compound key so each day has its own counter
    key = f"{name}_{today}"

    r = await db.counters.find_one_and_update(
        {"_id": key},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )

    return r["seq"]

def hash_password(plain: str) -> str:
    return bcrypt.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.verify(plain, hashed)
    except Exception:
        return False

async def leaderboard_entry(current_game, rankings):
    """Create leaderboard entries based on game results and rankings."""
    participants = current_game.get("participants", [])
    game_id = current_game["_id"]
    game_number = current_game["gameNumber"]
    game_type = current_game["gameType"]
    playedAt = current_game.get("createdAt","No Time")
    # players that selected first postion ball
    # fisrt ball is first item of rankings
    first_position_ball = None
    top_10_balls = []
    for ball_key, position in rankings.items():
        if position == 1:
            first_position_ball = int(ball_key.replace("ball_", ""))
        if position <=10:
            top_10_balls.append(int(ball_key.replace("ball_", "")))

    playername_with_first_ball = None 
    player_index = None
    for participant in participants:
        if participant.get("ball") == str(first_position_ball):
            playername_with_first_ball = participant.get("username")
            # get player index in participants
            player_index = participants.index(participant)
            break   
    if player_index is None:
        player_index = 1
    # get first position player details
    first_player_details = await db.users.find_one({"username": playername_with_first_ball})
    if first_player_details is None:
        first_player_details = {"username": "No First Player"}   
    races_played = sum(race.get("races", 0) for race in first_player_details.get("racesPlayed", [])) + 1
    winning_streak = first_player_details.get("winningStreak", 0) + 1
    # sum up all the wins from numberOfWins array
    wins = sum(win.get("wins", 0) for win in first_player_details.get("numberOfWins", [])) + 1
    points = first_player_details.get("total_points", 0) + POS_POINT.get("1", 0)
    # insert into leaderboard 
    # log the first position player details
    print(f"Logging leaderboard entry for player: {playername_with_first_ball}")
    await db.leaderboard.insert_one({
        "gameId": game_id,
        "raceId": game_number,
        "datePlayed": playedAt,
        "username": playername_with_first_ball,
        "player": player_index,
        "ballNumber": first_position_ball,
        "points": points,
        "position": 1,
        "top10Balls": top_10_balls,
        "races": races_played,
        "type": game_type,
        "winningStreak": winning_streak,
        "wins": wins,
    })
    return True

async def pastwinner_entry(current_game, rankings):
    """
    Create a past winners entry for the last race.
    This will save top 3 finishers into the 'past_winners' collection.
    """

    participants = current_game.get("participants", [])
    game_id = current_game["_id"]
    game_number = current_game["gameNumber"]
    game_type = current_game["gameType"]
    playedAt = current_game.get("createdAt", "No Time")

    finishers = []  

    for ball_key, pos in rankings.items():
        if pos <= 3:  
            ball_number = int(ball_key.replace("ball_", ""))

            username = "Unknown"
            for p in participants:
                if p.get("ball") == ball_number:
                    username = p.get("username", "Unknown")
                    break

            finishers.append({
                "username": username,
                "position": pos,
                "ball": ball_number,
                "time": "N/A"  
            })

    finishers = sorted(finishers, key=lambda x: x["position"])

    past_race_doc = {
        "raceId": game_number,
        "gameId": game_id,
        "mode": game_type,
        "datePlayed": playedAt,
        "duration": "N/A",        # TODO : calculate duration if possible
        "topFinishers": finishers
    }

    await db.past_winners.insert_one(past_race_doc)

    return True

async def scheduler():
    """Continuously manages game status transitions."""
    while True:
        # 1️⃣ Fetch all 'Not Started' games in order
        games_cursor = db.games.find({"status": "Not Started"}).sort("createdAt", 1)
        games = await games_cursor.to_list(length=None)

        if not games:
            await asyncio.sleep(30)
            continue

        print(f"🎯 Found {len(games)} 'Not Started' games to schedule")

        # 2️⃣ Start with the first game as 'initial'
        initial_game = games[0]
        current_start = datetime.utcfromtimestamp(initial_game["createdAt"] / 1000) \
                        + timedelta(minutes=initial_game["timerTillNextGame"])

        # process all games one by one
        for i, game in enumerate(games):
            game_id = game["_id"]
            created_at = datetime.utcfromtimestamp(game["createdAt"] / 1000)
            timer_minutes = game["timerTillNextGame"]

            start_time = created_at + timedelta(minutes=timer_minutes)


            now = datetime.utcnow()
            wait_seconds = (start_time - now).total_seconds()
            if wait_seconds < 0:
                print(f"⚠️ Game {game_id} start time already passed, starting immediately. Wait: {wait_seconds:.2f}")
                wait_seconds = 0

            print(f"🕒 Game {i+1}: {game_id} will start in {wait_seconds:.2f}s")

            # 3️⃣ Wait until the start time
            await asyncio.sleep(wait_seconds)

            # 4️⃣ Mark as Ongoing
            await db.games.update_one(
                {"_id": game_id},
                {"$set": {"status": "Ongoing"}}
            )
            print(f"🚀 Game {game_id} is now Ongoing")

            interval = 5  # check every 5 seconds if game was force-finished
            elapsed = 0
            while True:
                await asyncio.sleep(interval)
                elapsed += interval

                # Check if game was force-finished externally
                ongoing = await db.games.find_one({"_id": game_id, "status": "Ongoing"})
                if not ongoing:
                    print(f"⚡ Game {game_id} was force finished. Moving on.")
                    break

                # check for endAt time if endAT found then stop the game
                if "endedAt" in ongoing and ongoing["endedAt"] > 0:
                    print(f"⚡ Game {game_id} has ended at {ongoing['endedAt']}. Moving on.")
                    # mark as finished
                    await db.games.update_one(
                        {"_id": game_id},
                        {"$set": {"status": "Finished"}}
                    )
                    break
                

            # 7️⃣ Move current_start forward for next game
            current_start = start_time + timedelta(minutes=game["timerTillNextGame"])

        # 8️⃣ After finishing all games, sleep a bit before rechecking
        print("✅ All pending games processed. Waiting for new games...")
        await asyncio.sleep(30)

async def create_session(username: str) -> str:
    sid = base64.urlsafe_b64encode(uuid.uuid4().bytes).decode().rstrip("=")
    expires_at = datetime.utcnow() + timedelta(seconds=SESSION_EXPIRE_SECONDS)
    await db.sessions.insert_one({
        "_id": sid,
        "username": username,
        "created_at": datetime.utcnow(),
        "expires_at": expires_at
    })
    return sid

async def fetch_prize(prize_id: str) -> Optional[Dict[str, Any]]:
    prize = await db.prizes.find_one({"_id": ObjectId(prize_id)})
    if prize == None:
        print(f"Prize with id {prize_id} not found.")
    return prize['title'] if prize else None

async def create_points_only_prize() -> str:
    # we can have the id stored in .env
    points_only_prize_id = os.getenv("POINTS_ONLY_PRIZE_ID")
    if points_only_prize_id:
        existing = await db.prizes.find_one({"_id": points_only_prize_id})
        if existing:
            return existing["_id"]

    # check if a Points Only entry exists
    existing = await db.prizes.find_one({"title": "Points Only"})
    if existing:
        os.environ["POINTS_ONLY_PRIZE_ID"] = str(existing["_id"])
        return str(existing["_id"])

    prize_doc = {
        "title": "Points Only",
        "description": "No physical prize, points only reward.",
        "createdAt": datetime.utcnow()
    }
    result = await db.prizes.insert_one(prize_doc)
    os.environ["POINTS_ONLY_PRIZE_ID"] = str(result.inserted_id)

    return str(result.inserted_id)

async def get_session(sid: str):
    if not sid: 
        return None
    s = await db.sessions.find_one({"_id": sid})
    if not s:
        return None
    if s.get("expires_at") and s["expires_at"] < datetime.utcnow():
        await db.sessions.delete_one({"_id": sid})
        return None
    return s

async def require_login(request: Request):
    sid = request.cookies.get("session_id")
    session = await get_session(sid)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    return session["username"]

def format_timestamp(timestamp: int) -> str:
    """Convert millisecond timestamp to readable date string"""
    try:
        dt = datetime.fromtimestamp(timestamp / 1000.0)
        return dt.strftime('%Y-%m-%d %H:%M:%S')
    except:
        return 'N/A'

# ---------- Models ----------
class GameModel(BaseModel):
    gameType: str
    numberOfBalls: int = 12
    bonusBalls: Optional[int] = 0
    starttimeofgame: int
    prizeId: str
    timerPerRace: str
    timerTillNextGame: str
    participants: List = []
    attempters: List = []
    winners: List = []
    status: str = "Not Started"
    gameNumber: int
    createdAt: int = int(datetime.now(timezone.utc).timestamp()*1000)
    endedAt: int


# ---------- Auth endpoints ----------
@app.get("/login", response_class=HTMLResponse)
async def login_form(request: Request):
    return templates.TemplateResponse("login.html", {"request": request, "error": None})

@app.post("/login")
async def login(request: Request, response: Response, username: str = Form(...), password: str = Form(...)):
    # Admin user stored in collection 'admins'
    admin = await db.admins.find_one({"username": username})
    if admin and "password_hash" in admin:
        if verify_password(password, admin["password_hash"]):
            sid = await create_session(username)
            resp = RedirectResponse(url="/dashboard", status_code=302)
            resp.set_cookie("session_id", sid, httponly=True, secure=False, samesite="lax")  # secure=True when using HTTPS via nginx
            return resp
        else:
            return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})
    else:
        # Optionally allow first-run create admin if env provided
        env_admin = os.getenv("ADMIN_USERNAME")
        env_pass = os.getenv("ADMIN_PASSWORD")
        env_hash = os.getenv("ADMIN_PASSWORD_HASH")
        if env_admin and username == env_admin and (env_pass or env_hash):
            if env_hash:
                pwok = verify_password(password, env_hash)
            else:
                pwok = password 
            if pwok:
                # create persistent admin doc
                password_hash = env_hash if env_hash else hash_password(password)
                # save new hashed password in env for future restarts
                os.environ["ADMIN_PASSWORD_HASH"] = password_hash
                await db.admins.update_one({"username": username}, {"$set": {"username": username, "password_hash": password_hash}}, upsert=True)
                sid = await create_session(username)
                resp = RedirectResponse(url="/dashboard", status_code=302)
                resp.set_cookie("session_id", sid, httponly=True, secure=False, samesite="lax")
                return resp
        return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"})

@app.get("/logout")
async def logout(request: Request):
    sid = request.cookies.get("session_id")
    if sid:
        await db.sessions.delete_one({"_id": sid})
    resp = RedirectResponse(url="/login", status_code=302)
    resp.delete_cookie("session_id")
    return resp

# ---------- Dashboard & templates ----------
@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse("/login")

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    try:
        username = await require_login(request)
    except HTTPException:
        return RedirectResponse("/login")
    
    prizes = await db.prizes.find().to_list(length=1000)
    next_game = await db.games.find_one({"status": "Not Started"}, sort=[("createdAt", 1)])
    current_game = await db.games.find_one({"status": "Ongoing"}, sort=[("createdAt", 1)])
    context = {
        "request": request,
        "username": username,
        "prizes": prizes,
        "nextGame": next_game,
        "currentGame": current_game,
    }
    return templates.TemplateResponse("dashboard.html", context)

@app.get("/past-winners", response_class=HTMLResponse)
async def past_winners_page(request: Request):
    try:
        username = await require_login(request)
    except HTTPException:
        return RedirectResponse("/login")
    
    # Fetch past winners from pastWinners collection
    winners_cursor = db.pastWinners.find().sort("createdAt", -1).limit(500)
    past_winners = await winners_cursor.to_list(length=500)
    
    # Format the timestamps for display
    for winner in past_winners:
        winner['createdAt_formatted'] = format_timestamp(winner.get('createdAt', 0))
    
    context = {
        "request": request,
        "username": username,
        "pastWinners": past_winners,
    }
    return templates.TemplateResponse("past_winners.html", context)

# ---------- API endpoints to mirror your React functions ----------
@app.post("/api/games/new")
async def api_new_game(
    request: Request,
    gameType: str = Form(...),
    timerTillNextGame: str = Form(...),
    prize: str = Form(...)
):
    await require_login(request)
    
    if prize == "Points Only":
        prize = await create_points_only_prize()
    
    game_number = await get_next_sequence("gameNumber")
    prize_title = await fetch_prize(prize) if prize else "Points Only"
    # game_number is game_number+ddmmyyyy
    game_number = f"{game_number}{datetime.utcnow().strftime('%d%m%Y')}"
    # Convert timer to minutes for storage
    timer_minutes = int(timerTillNextGame)
    
    game_doc = {
        "status": "Not Started",
        "gameType": gameType,
        "gameNumber": game_number,
        "numberOfBalls": 12,
        "bonusBalls": 0,
        "prizeId": prize,
        "prizeTitle": prize_title,
        "timerTillNextGame": timer_minutes,
        "participants": [],
        "kicked": [],
        "attempters": [],
        "winners": [],
        "createdAt": int(datetime.utcnow().timestamp() * 1000)
    }
    
    await db.games.insert_one(game_doc)
    return RedirectResponse("/dashboard", status_code=303)


@app.post("/api/games/forcefinish")
async def api_force_finish_game(request: Request):
    await require_login(request)
    ongoing_game = await db.games.find_one({"status": "Ongoing"})
    if not ongoing_game:
        raise HTTPException(status_code=404, detail="No ongoing game found")
    await db.games.update_one(
        {"_id": ongoing_game["_id"]},
        {"$set": {"status": "Finished", "endedAt": int(datetime.utcnow().timestamp() * 1000)}}
    )
    return RedirectResponse(url="/dashboard", status_code=303)

@app.post("/api/games/update")
async def api_update_current_game(request: Request,
                                  winners: Optional[str] = Form(""),
                                  raceWinners: Optional[str] = Form(""),
                                  kick_ids: Optional[str] = Form(""),
                                  add_ids: Optional[str] = Form(""),
                                  game_id: str = Form("")):
    await require_login(request)
    # parse logic similar to your React handlers
    update_ops = {}
    if winners:
        arr = [s.strip() for s in winners.split(",") if s.strip()]
        update_ops["winners"] = arr
        update_ops["status"] = "Finished"
        update_ops["endedAt"] = int(datetime.utcnow().timestamp()*1000)
    if raceWinners:
        arr = [s.strip() for s in raceWinners.split(",") if s.strip()]
        update_ops["raceWinners"] = arr

    if kick_ids:
        arr = [s.strip() for s in kick_ids.split(",") if s.strip()]
        await db.games.update_one(
            {"_id": game_id},
            {"$pull": {"participants": {"participantId": {"$in": arr}}}}
        )

    if add_ids:
        arr = [s.strip() for s in add_ids.split(",") if s.strip()]
        new_players = [{"participantId": a, "participantName": a, "ball": None} for a in arr]
        await db.games.update_one(
            {"_id": game_id},
            {"$push": {"participants": {"$each": new_players}}}
        )

    if update_ops:
        await db.games.update_one({"_id": game_id}, {"$set": update_ops})

    return RedirectResponse("/dashboard", status_code=303)


@app.get("/api/games/status")
async def get_game_status():
    current_game = await db.games.find_one({"status": "Ongoing"})
    next_game = await db.games.find_one({"status": "Not Started"})
    return JSONResponse({
        "currentGame": {
            "gameNumber": current_game.get("gameNumber") if current_game else None,
            "status": current_game.get("status") if current_game else None
        } if current_game else None,
        "nextGame": {
            "gameNumber": next_game.get("gameNumber") if next_game else None,
            "status": next_game.get("status") if next_game else None
        } if next_game else None
    })

@app.post("/api/prizes/new")
async def api_new_prize(request: Request, title: str = Form(...), description: str = Form("")):
    await require_login(request)
    await db.prizes.insert_one({
        "title": title,
        "description": description,
        "createdAt": datetime.utcnow()
    })
    return RedirectResponse("/dashboard", status_code=303)
@app.get("/api/users/all")
async def api_get_all_users(request: Request):
    await require_login(request)
    users = await db.users.find({}, {"_id": 1, "username": 1, "email": 1}).to_list(length=500)
    return [
        {"id": str(u["_id"]), "name": u.get("username", "Unknown"), "email": u.get("email", "")}
        for u in users
    ]

# this is a new leaderbaord route 
# this will take all the user data from latest updated to old updated from mongodb user
# 

@app.post("/api/prizes/delete")
async def api_delete_prize(request: Request, prize_id: str = Form(...)):
    await require_login(request)
    await db.prizes.delete_one({"_id": ObjectId(prize_id)})
    return RedirectResponse("/dashboard", status_code=303)

# Add more endpoints as needed (past winners listing, deleting games, etc.)
@app.post("/api/submit_rankings")
async def submit_rankings(rankings: Dict[str, int]):
    # This endpoint can be used to receive ball rankings from the detection script
    # For now, we will just log them and return a success response
    print("Received ball rankings:", rankings)
    current_game = await db.games.find_one({"status": "Ongoing"})
    # in current game add the ball rankings in ball_ rankings
    if current_game:
        await db.games.update_one(
            {"_id": current_game["_id"]},
            {"$set": {"ball_rankings": rankings}}
        )

        # extract the participants
        participants = current_game.get("participants", [])
        if participants:
            for participant in participants:
                # get userId or email direct from participant
                participant_id = participant.get("userId") or participant.get("email") or participant.get("participantId")
                ball_number = participant.get("ball")
                ball_number_str = "ball_" + str(ball_number)
                if ball_number_str in rankings:
                    position = rankings[ball_number_str]
                    points = POS_POINT.get(str(position), 0)
                    # update user total_points in users collection and in points add like this {"points": {points},{utc time now}}
                    # racePlayed  will be store like this "racesPlayed": +1, utc time now
                    # numberOfWins +1 if position is 1,2,3 and utc time now
                    user = await db.users.find_one({"$or": [{"_id": ObjectId(participant_id)}, {"email": participant_id}]})
                    if user:
                        new_points = user.get("points", 0) + points
                        await db.users.update_one(
                            {"_id": user["_id"]},
                            {"$set": {"total_points": new_points}}
                        )
                        await db.users.update_one(
                            {"_id": user["_id"]},
                            {"$push": {"points": {"points": points, "timestamp": int(datetime.utcnow().timestamp() * 1000)}}}
                        )
                        # update numberOfWins if position is 1,2,3
                        if position in [1, 2, 3]:
                            await db.users.update_one(
                                {"_id": user["_id"]},
                                {"$push": {"numberOfWins": {"wins": 1, "timestamp": int(datetime.utcnow().timestamp() * 1000)}}}
                            )
                        # create streak in user
                        if position == 1:
                            new_streak = user.get("winningStreak", 0) + 1
                            await db.users.update_one(
                                {"_id": user["_id"]},
                                {"$set": {"winningStreak": new_streak}}
                            )
                        else:
                            # reset streak
                            await db.users.update_one(
                                {"_id": user["_id"]},
                                {"$set": {"winningStreak": 0}}
                            )
                        # increment the racesPlayed
                        await db.users.update_one(
                            {"_id": user["_id"]},
                            {"$push": {"racesPlayed": {"races": 1, "timestamp": int(datetime.utcnow().timestamp() * 1000)}}}
                        )
        await leaderboard_entry(current_game, rankings)
        # mark current game as Finished
        # add endedAt time no need to update status as Finished will be handled by the scheduler
        await db.games.update_one(
            {"_id": current_game["_id"]},
            {"$set": {"endedAt": int(datetime.utcnow().timestamp() * 1000)}}
        )
        await db.games.update_one(
            {"_id": current_game["_id"]},
            {"$set": {"status": "Finished"}}
        )

    return {"status": "success", "message": "Rankings received"}
# ---------- Startup: ensure counters exist ----------
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(scheduler())
    env_admin = os.getenv("ADMIN_USERNAME")
    env_pass = os.getenv("ADMIN_PASSWORD")
    env_hash = os.getenv("ADMIN_PASSWORD_HASH")
    # points only prize check on startup
    await create_points_only_prize()
    if env_admin and (env_pass or env_hash):
        existing = await db.admins.find_one({"username": env_admin})
        if not existing:
            pw = env_hash if env_hash else hash_password(env_pass)
            await db.admins.insert_one({"username": env_admin, "password_hash": pw})
    await db.counters.update_one({"_id": "gameNumber"}, {"$setOnInsert": {"seq": 0}}, upsert=True)