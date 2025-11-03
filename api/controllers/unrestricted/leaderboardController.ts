import { Request, Response } from "express";
import mongoose from "mongoose";
import { Leaderboard } from "../../models/Leaderboard";
import { LeaderboardTemp } from "../../models/LeaderboardTemp";
import { buildTimeFilter } from "../../utils/timeFilter";

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const useTemp = req.query.temp === "true";
    const time = req.query.time as string;
    const compT = req.query.compT as string;
    const raceId = req.query.raceId as string | undefined;
    const customFrom = req.query.from as string | undefined;
    const customTo = req.query.to as string | undefined;

    let Model: mongoose.Model<any> = useTemp ? LeaderboardTemp : Leaderboard;
    let filter: any = {};

    // ✅ Race type filter
    if (compT === "simple") filter.type = "simple";
    if (compT === "comps") filter.type = "comps";

    // ✅ Time filter
    Object.assign(filter, buildTimeFilter(time, customFrom, customTo));

    // ✅ Race filter
    if (raceId) filter.raceId = raceId;
    console.log("📊 Filter:", filter);
    console.log("📁 Model:", useTemp ? "LeaderboardTemp" : "Leaderboard");

    const data = await Model.find(filter).sort({ points: -1 }).limit(100).lean();

    res.json({ users: data });
  } catch (err) {
    console.error("❌ Leaderboard error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
















// // controllers/unrestricted/leaderboardController.ts
// import { Request, Response } from "express";
// import mongoose from "mongoose";
// import { Leaderboard } from "../../models/Leaderboard";
// import { LeaderboardTemp } from "../../models/LeaderboardTemp";

// export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const useTemp = req.query.temp === "true";
//     const time = req.query.time as string;
//     const compT = req.query.compT as string;

//     let Model: mongoose.Model<any>;
//     if (useTemp) {
//       Model = LeaderboardTemp as mongoose.Model<any>;
//     } else {
//       Model = Leaderboard as mongoose.Model<any>;
//     }

//     // ✅ filter logic
//     let filter: any = {};

//     if (time && time !== "all") {
//       const now = new Date();
//       let startDate: Date | null = null;

//       if (time === "today") {
//         startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//       } else if (time === "week") {
//         const firstDayOfWeek = new Date(now);
//         firstDayOfWeek.setDate(now.getDate() - now.getDay());
//         startDate = firstDayOfWeek;
//       } else if (time === "month") {
//         startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//       } else if (time === "year") {
//         startDate = new Date(now.getFullYear(), 0, 1);
//       }

//       if (startDate) {
//         filter.date = { $gte: startDate };
//       }
//     }

//     if (compT === "today") {
//       const startOfDay = new Date();
//       startOfDay.setHours(0, 0, 0, 0);
//       filter.date = { ...(filter.date || {}), $gte: startOfDay };
//     }

//     const data = await Model.find(filter)
//       .sort({ points: -1 })
//       .limit(100)
//       .lean();

//     res.json({ users: data });
//   } catch (err) {
//     console.error("❌ Leaderboard error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };
