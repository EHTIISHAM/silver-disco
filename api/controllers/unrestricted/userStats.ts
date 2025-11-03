import { Request, Response } from "express";
import { Leaderboard } from "../../models/Leaderboard";
import User from "../../models/User";
import verifyJwt from "../../helpers/auth/verifyJwt";

export async function getUserStats(req: Request, res: Response): Promise<void> {
  try {
    let { userId } = req.params;

    // ✅ If userId not provided, try to get it from JWT cookie
    if (!userId) {
      const token = req.cookies.token;
      if (!token) {
        res.status(401).json({ msg: "Unauthorized: No token provided" });
        return;
      }
      const decoded = await verifyJwt(token);
      if (!decoded) {
        res.status(401).json({ msg: "Unauthorized: Invalid token" });
        return;
      }
      userId = decoded.userId;
    }

    // ✅ Fetch user details
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    // ✅ Aggregate leaderboard stats for this user
    const stats = await Leaderboard.aggregate([
      { $match: { username: user.username } },
      {
        $group: {
          _id: "$username",
          totalRaces: { $sum: 1 },
          totalPoints: { $sum: "$points" },
          totalWins: { $sum: "$wins" },
        },
      },
    ]);

    const userStats = stats[0] || { totalRaces: 0, totalPoints: 0, totalWins: 0 };

    // ✅ Calculate average finish rate
    const avgFinishRate =
      userStats.totalRaces > 0
        ? ((userStats.totalWins / userStats.totalRaces) * 100).toFixed(1) + "%"
        : "0%";

    // ✅ Optional: create weeklyPoints array for graph (example data)
    const weeklyPoints = [
      { name: "Mon", points: 100 },
      { name: "Tue", points: 120 },
      { name: "Wed", points: 80 },
      { name: "Thu", points: 150 },
      { name: "Fri", points: 90 },
      { name: "Sat", points: 130 },
      { name: "Sun", points: 110 },
    ];

    // ✅ Return JSON response
    res.json({
      username: user.username,
      totalRaces: userStats.totalRaces,
      totalPoints: userStats.totalPoints,
      totalWins: userStats.totalWins,
      avgFinishRate,
      weeklyPoints,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching user stats" });
  }
}











// import { Request, Response } from "express";
// import { Leaderboard } from "../../models/Leaderboard";
// import User from "../../models/User";

// export async function getUserStats(req: Request, res: Response): Promise<void> {
//   try {
//     const { userId } = req.params;

//     if (!userId) {
//       res.status(400).json({ msg: "User ID required" });
//       return;
//     }

//     // Fetch user details
//     const user = await User.findById(userId);
//     if (!user) {
//       res.status(404).json({ msg: "User not found" });
//       return;
//     }

//     // Aggregate leaderboard stats for this user
//     const stats = await Leaderboard.aggregate([
//       { $match: { username: user.username } },
//       {
//         $group: {
//           _id: "$username",
//           totalRaces: { $sum: 1 },
//           totalPoints: { $sum: "$points" },
//           totalWins: { $sum: "$wins" },
//         },
//       },
//     ]);

//     if (stats.length === 0) {
//       res.json({
//         username: user.username,
//         totalRaces: 0,
//         totalPoints: 0,
//         totalWins: 0,
//         avgFinishRate: "0%",
//       });
//       return;
//     }

//     const userStats = stats[0];
//     const avgFinishRate =
//       userStats.totalRaces > 0
//         ? ((userStats.totalWins / userStats.totalRaces) * 100).toFixed(1) + "%"
//         : "0%";

//     res.json({
//       username: user.username,
//       totalRaces: userStats.totalRaces,
//       totalPoints: userStats.totalPoints,
//       totalWins: userStats.totalWins,
//       avgFinishRate,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Error fetching user stats" });
//   }
// }
