import express from "express";
import { home } from "../controllers/user/home";
import authenticate from "../middlewares/authenticate";
import { getProfile } from "../controllers/user/getProfile";

const user = express.Router();

user.get("/home", authenticate, home);
user.get("/get_profile", authenticate, getProfile);

export default user;
