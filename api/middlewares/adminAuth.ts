import { Request, Response, NextFunction } from "express";
import verifyJwt from "../helpers/auth/verifyJwt";
import { decode } from "jsonwebtoken";
import User from "../models/User";

export default async function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string = req.cookies.adminToken;

  if (token) {
    let userVerified = await verifyJwt(token);

    if (userVerified) {
      const userId = await decode(token);

      const user = await User.findOne({
        _id: userId,
        userType: "Admin",
      });

      if (user) {
        next();
      } else {
        next("User not authenticated.");
      }
    } else {
      next("User not authenticated.");
    }
  } else {
    next("User not authenticated.");
  }
}
