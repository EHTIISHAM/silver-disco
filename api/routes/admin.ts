import express from "express";
import authenticateAdmin from "../middlewares/authenticateAdmin";
import { dashboard } from "../controllers/admin/dashboard";
import { getAdminProfile } from "../controllers/admin/getAdminProfile";
import { uploadPrizeImage } from "../controllers/admin/uploadPrizeImage";
import { adminAuthMiddleware } from '../middlewares/adminAuth';

const dashboardRoutes = express.Router();

dashboardRoutes.get("/dashboard", authenticateAdmin, dashboard);
dashboardRoutes.get("/get_admin_profile", authenticateAdmin, getAdminProfile);
dashboardRoutes.post("/upload_prize_image", authenticateAdmin, uploadPrizeImage);
// dashboardRoutes.get('/dashboard', adminAuthMiddleware,dashboard);

export default dashboardRoutes;
