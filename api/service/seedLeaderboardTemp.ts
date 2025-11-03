import mongoose from "mongoose";
import dotenv from "dotenv";
import { LeaderboardTemp } from "../models/LeaderboardTemp";

dotenv.config();

(async () => {
  try {
    if (!process.env.MONGODB_URL) throw new Error("❌ MONGODB_URL not defined");

    await mongoose.connect(process.env.MONGODB_URL);
    console.log("✅ MongoDB connected.");

    // Clear old data
    await LeaderboardTemp.deleteMany({});
    console.log("🧹 Cleared existing temp leaderboard data.");

    for (let i = 1; i <= 30; i++) {
      // Random date in last 30 days
      const randomDaysAgo = Math.floor(Math.random() * 30);
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - randomDaysAgo);

      // Simple or comps
      const type = i % 2 === 0 ? "simple" : "comps";

      // Generate a fake Race ID
      const raceId = `RACE-${Math.floor(Math.random() * 900000 + 100000)}`;

      // Create record
      await LeaderboardTemp.create({
        username: `TestPlayer${i}`,
        pfp: `https://api.dicebear.com/6.x/pixel-art/svg?seed=${i}`,
        races: Math.floor(Math.random() * 200),
        wins: Math.floor(Math.random() * 50),
        points: Math.floor(Math.random() * 10000),
        datePlayed: randomDate,
        type,
        raceId,
        position: i, // ✅ Added position
      });
    }

    console.log("✅ Temp leaderboard seeded successfully with raceId & position fields.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding temp leaderboard:", err);
    process.exit(1);
  }
})();












// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import { LeaderboardTemp } from "../models/LeaderboardTemp";

// dotenv.config();

// (async () => {
//   try {
//     if (!process.env.MONGODB_URL) throw new Error("❌ MONGODB_URL not defined");

//     await mongoose.connect(process.env.MONGODB_URL);

//     await LeaderboardTemp.deleteMany({});

//     for (let i = 1; i <= 30; i++) {
//       const randomDaysAgo = Math.floor(Math.random() * 30);
//       const randomDate = new Date();
//       randomDate.setDate(randomDate.getDate() - randomDaysAgo);

//       const type = i % 2 === 0 ? "simple" : "comps";

//       await LeaderboardTemp.create({
//         username: `TestPlayer${i}`,
//         pfp: `https://api.dicebear.com/6.x/pixel-art/svg?seed=${i}`,
//         races: Math.floor(Math.random() * 200),
//         wins: Math.floor(Math.random() * 50),
//         points: Math.floor(Math.random() * 10000),
//         datePlayed: randomDate,
//         type,
//       });
//     }

//     console.log("✅ Temp leaderboard seeded successfully with dummy simple & comps data");
//     process.exit(0);
//   } catch (err) {
//     console.error("❌ Error seeding temp leaderboard:", err);
//     process.exit(1);
//   }
// })();




