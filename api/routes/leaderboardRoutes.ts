// routes/leaderboardRoutes.ts
import { Router } from "express";
import { getLeaderboard } from "../controllers/unrestricted/leaderboardController";

const router = Router();

router.get("/", getLeaderboard);

export default router;
