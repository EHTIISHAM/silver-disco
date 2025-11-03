import express from "express";
import { signUp } from "../controllers/unrestricted/signUp";
import { login } from "../controllers/unrestricted/login";
import { authenticateTiktok } from "../controllers/unrestricted/authenticateTiktok";
import { redirect } from "../controllers/unrestricted/redirect";
import { demoSignUp } from "../controllers/unrestricted/demoSignUp";
import { demoLogin } from "../controllers/unrestricted/demoLogin";
import { enterAddress } from "../controllers/unrestricted/enterAddress";
import { authenticateGoogle } from "../controllers/unrestricted/authenticateGoogle";
import { googleRedirect } from "../controllers/unrestricted/googleRedirect";
import { authenticateTwitch } from "../controllers/unrestricted/authenticateTwitch";
import { twitchRedirect } from "../controllers/unrestricted/twitchRedirect";
import { logout } from "../controllers/unrestricted/logout";
import leaderboardRoutes from "./leaderboardRoutes";
import { gameWebhook } from "../controllers/unrestricted/gameWebhook";
import { getUserStats } from "../controllers/unrestricted/userStats";
import { getTiktokStatus } from "../controllers/unrestricted/getTiktokStatus";

const unrestricted = express.Router();

unrestricted.get("/stats/:userId", getUserStats);
unrestricted.get("/tiktok-status", getTiktokStatus);

unrestricted.use("/leaderboard", leaderboardRoutes);

// Google
unrestricted.get("/auth/google", authenticateGoogle);
unrestricted.get("/googleRedirect", googleRedirect);
// Kick


unrestricted.get("/twitch", authenticateTwitch);
unrestricted.get("/twitchRedirect", twitchRedirect);


unrestricted.post("/logout", logout);

unrestricted.post("/game_webhook", gameWebhook);

unrestricted.get("/authenticate_tiktok", authenticateTiktok);
unrestricted.get("/redirect", redirect);
unrestricted.post("/login", login);
unrestricted.post("/sign_up", signUp);
unrestricted.post("/demo_sign_up", demoSignUp);
unrestricted.post("/demo_login", demoLogin);
unrestricted.post("/enter_address", enterAddress);

export default unrestricted;







// import express from "express";
// import { signUp } from "../controllers/unrestricted/signUp";
// import { login } from "../controllers/unrestricted/login";
// import { authenticateTiktok } from "../controllers/unrestricted/authenticateTiktok";
// import { redirect } from "../controllers/unrestricted/redirect";
// import { demoSignUp } from "../controllers/unrestricted/demoSignUp";
// import { demoLogin } from "../controllers/unrestricted/demoLogin";
// import { enterAddress } from "../controllers/unrestricted/enterAddress";

// const unrestricted = express.Router();

// unrestricted.get("/authenticate_tiktok", authenticateTiktok);
// unrestricted.get("/redirect", redirect);
// unrestricted.post("/login", login);
// unrestricted.post("/sign_up", signUp);
// unrestricted.post("/demo_sign_up", demoSignUp);
// unrestricted.post("/demo_login", demoLogin);
// unrestricted.post("/enter_address", enterAddress);

// export default unrestricted;
