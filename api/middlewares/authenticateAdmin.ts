import { Request, Response, NextFunction } from "express";
import verifyJwt from "../helpers/auth/verifyJwt";
import { decode } from "jsonwebtoken";
import User from "../models/User";

export default async function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction
):Promise<any> {
  try {
    const token = req.cookies.adminToken;
    if (!token)
      return res.status(401).json({ error: "User not authenticated. No token found." });

    const verified = await verifyJwt(token);
    if (!verified)
      return res.status(401).json({ error: "User not authenticated. Not verified." });

    const decoded: any = decode(token);
    const user = await User.findOne({ _id: decoded?.id, userType: "Admin" });

    if (!user)
      return res.status(403).json({ error: "User not authenticated. Not an admin." });

    next();
  } catch (err) {
    console.error("Admin auth error:", err);
    res.status(500).json({ error: "Server error during authentication." });
  }
}
