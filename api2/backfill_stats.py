# backfill_stats.py
#
# One-off migration for the Phase 1 championship/retention release.
#
# Existing players only have the legacy arrays (points[], racesPlayed[],
# numberOfWins[]). The new profile, leaderboard and streak features read flat
# counters instead, so this derives them from history and writes them once.
# From then on record_race_result() in championship.py keeps them current.
#
# Safe to re-run: every value is recomputed from the arrays, which are still
# appended to on every race, so the result is the same each time.
#
#   python backfill_stats.py              # dry run — prints, changes nothing
#   python backfill_stats.py --apply      # actually writes
#   python backfill_stats.py --apply --limit 20
#
# Run it from the api2 directory so .env is picked up.

import os
import sys
import asyncio
import argparse
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "pinballrace_com")

# Podium point values across both race types:
#   live     1st=20  2nd=10  3rd=5
#   on-demand 1st=10 2nd=5   3rd=3
# 4th-10th always scores exactly 1 and 11+ scores 0, so any entry worth 3, 5,
# 10 or 20 points was a podium finish. That makes podium counts exact even
# though the raw position was never stored.
PODIUM_POINTS = {3, 5, 10, 20}


def safe_ts(value):
    """Legacy timestamps are seconds-since-epoch ints, but a few are datetimes."""
    if isinstance(value, datetime):
        return int(value.replace(tzinfo=timezone.utc).timestamp())
    if isinstance(value, (int, float)):
        return int(value)
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def day_key_from_ts(ts: int) -> str:
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")


def streaks_from_days(days):
    """
    Given the set of UTC days a player raced on, return
    (current_run_length, longest_run_length, last_active_day).

    current_run_length is the trailing consecutive run. Whether that run is
    still alive is decided at read time by championship.effective_streak(),
    which is why lastActiveDate is stored alongside it.
    """
    if not days:
        return 0, 0, None

    ordered = sorted(days)
    longest = current = 1
    for prev, cur in zip(ordered, ordered[1:]):
        prev_d = datetime.strptime(prev, "%Y-%m-%d")
        cur_d = datetime.strptime(cur, "%Y-%m-%d")
        if cur_d - prev_d == timedelta(days=1):
            current += 1
        else:
            current = 1
        longest = max(longest, current)

    return current, longest, ordered[-1]


def emit(line: str):
    """
    Usernames come from social logins and routinely contain emoji or non-Latin
    scripts. A Windows console defaults to cp1252 and would raise
    UnicodeEncodeError mid-migration, so degrade unprintable characters instead.
    """
    enc = sys.stdout.encoding or "utf-8"
    try:
        print(line)
    except UnicodeEncodeError:
        print(line.encode(enc, errors="replace").decode(enc, errors="replace"))


def compute(user):
    races_list = user.get("racesPlayed") or []
    wins_list = user.get("numberOfWins") or []
    points_list = user.get("points") or []

    total_races = sum(r.get("races", 0) for r in races_list)
    total_wins = sum(w.get("wins", 0) for w in wins_list)
    total_points = sum(p.get("points", 0) for p in points_list)
    total_podiums = sum(1 for p in points_list if p.get("points") in PODIUM_POINTS)

    days = set()
    for r in races_list:
        ts = safe_ts(r.get("timestamp"))
        if ts is not None:
            days.add(day_key_from_ts(ts))

    current_streak, longest_streak, last_active = streaks_from_days(days)

    # Never regress a longest streak the live app may already have recorded.
    longest_streak = max(longest_streak, int(user.get("longestStreak", 0) or 0))

    fields = {
        "totalRaces": total_races,
        "totalWins": total_wins,
        "totalPoints": total_points,
        "totalPodiums": total_podiums,
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
    }
    if last_active:
        fields["lastActiveDate"] = last_active

    # Only seed championship counters — never clobber real results.
    for key, default in (("championshipsEntered", 0), ("championshipWins", 0),
                         ("top10Finishes", 0), ("weeklyPoints", 0), ("weeklyRank", 0)):
        if key not in user:
            fields[key] = default

    return fields


def changed(user, fields):
    return {k: v for k, v in fields.items() if user.get(k) != v}


async def main():
    ap = argparse.ArgumentParser(description="Backfill Phase 1 player stat fields.")
    ap.add_argument("--apply", action="store_true", help="write changes (default is a dry run)")
    ap.add_argument("--limit", type=int, default=0, help="only process the first N users")
    args = ap.parse_args()

    db = AsyncIOMotorClient(MONGO_URI)[DB_NAME]
    total = await db.users.count_documents({})
    print(f"{'APPLY' if args.apply else 'DRY RUN'} — {DB_NAME}.users ({total} documents)")
    if args.limit:
        print(f"limited to first {args.limit}")
    print("-" * 78)

    cursor = db.users.find({})
    if args.limit:
        cursor = cursor.limit(args.limit)

    ops, seen, touched, shown = [], 0, 0, 0
    async for user in cursor:
        seen += 1
        fields = compute(user)
        diff = changed(user, fields)
        if not diff:
            continue
        touched += 1

        if shown < 15:
            shown += 1
            name = user.get("username") or user.get("email") or str(user["_id"])
            summary = ", ".join(f"{k}={v}" for k, v in list(diff.items())[:6])
            emit(f"  {name[:28]:<28} {summary}")
        elif shown == 15:
            shown += 1
            emit("  ... (further changes not listed)")

        ops.append(UpdateOne({"_id": user["_id"]}, {"$set": fields}))

        if args.apply and len(ops) >= 500:
            await db.users.bulk_write(ops, ordered=False)
            ops = []

    if args.apply and ops:
        await db.users.bulk_write(ops, ordered=False)

    print("-" * 78)
    print(f"scanned {seen} users, {touched} need updating")
    if args.apply:
        print(f"✅ wrote {touched} user documents")
    else:
        print("no changes written — re-run with --apply to commit")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(130)
