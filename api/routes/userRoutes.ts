import express from "express";
import { getMe } from "../controllers/user/getMe";

const router = express.Router();
router.get("/me", getMe);

export default router;
