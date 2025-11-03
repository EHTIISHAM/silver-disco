import { Namespace, Socket } from "socket.io";
import mongoose from "mongoose";
import { Leaderboard } from "../models/Leaderboard";
import { LeaderboardTemp } from "../models/LeaderboardTemp";
import { buildTimeFilter } from "../utils/timeFilter";

export default function leaderboardNamespace(nsp: Namespace) {
  nsp.on("connection", (socket: Socket) => {
    console.log("✅ Client connected to /leaderboard namespace");

    socket.on(
      "getLeaderboard",
      async ({
        temp,
        time,
        compT,
        raceId,
        from,
        to,
      }: {
        temp?: boolean;
        time?: string;
        compT?: string;
        raceId?: string | null;
        from?: string;
        to?: string;
      }) => {
        try {
          let Model: mongoose.Model<any> = temp ? LeaderboardTemp : Leaderboard;
          let filter: any = {};

          if (compT === "simple") filter.type = "simple";
          if (compT === "comps") filter.type = "comps";

          Object.assign(filter, buildTimeFilter(time, from, to));

          if (raceId) filter.raceId = raceId;

          const data = await Model.find(filter).sort({ points: -1 }).limit(100).lean();

          socket.emit("leaderboardData", { users: data });
        } catch (err) {
          console.error("❌ Socket leaderboard error:", err);
          socket.emit("leaderboardError", { error: "Server error" });
        }
      }
    );
  });
}












// import { Namespace, Socket } from "socket.io";
// import mongoose from "mongoose";
// import { Leaderboard } from "../models/Leaderboard";
// import { LeaderboardTemp } from "../models/LeaderboardTemp";

// export default function leaderboardNamespace(nsp: Namespace) {
//   nsp.on("connection", (socket: Socket) => {
//     console.log("✅ Client connected to /leaderboard namespace");

//     socket.on(
//       "getLeaderboard",
//       async ({
//         temp,
//         time,
//         compT,
//         raceId,
//       }: {
//         temp?: boolean;
//         time?: string;
//         compT?: string;
//         raceId?: string | null;
//       }) => {
//         try {
//           let Model: mongoose.Model<any>;
//           if (temp) {
//             Model = LeaderboardTemp as mongoose.Model<any>;
//           } else {
//             Model = Leaderboard as mongoose.Model<any>;
//           }

//           // ✅ filter logic
//           let filter: any = {};

//           if (time && time !== "all") {
//             const now = new Date();
//             let startDate: Date | null = null;

//             if (time === "today") {
//               startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//             } else if (time === "week") {
//               const firstDayOfWeek = new Date(now);
//               firstDayOfWeek.setDate(now.getDate() - now.getDay());
//               startDate = firstDayOfWeek;
//             } else if (time === "month") {
//               startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//             } else if (time === "year") {
//               startDate = new Date(now.getFullYear(), 0, 1);
//             }

//             if (startDate) {
//               filter.datePlayed = { $gte: startDate };
//             }
//           }

//           if (compT === "today") {
//             const startOfDay = new Date();
//             startOfDay.setHours(0, 0, 0, 0);
//             filter.datePlayed = { ...(filter.datePlayed || {}), $gte: startOfDay };
//           }

//           if (raceId) {
//             filter.raceId = raceId; // agar model me raceId field hai
//           }

//           const data = await Model.find(filter)
//             .sort({ points: -1 })
//             .limit(100)
//             .lean();

//           socket.emit("leaderboardData", { users: data });
//         } catch (err) {
//           console.error("❌ Socket leaderboard error:", err);
//           socket.emit("leaderboardError", { error: "Server error" });
//         }
//       }
//     );

//   });
// }
