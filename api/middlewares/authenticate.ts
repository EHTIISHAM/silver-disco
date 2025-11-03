import { Request, Response, NextFunction } from "express";
import verifyJwt from "../helpers/auth/verifyJwt";

export default async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let token: string = req.cookies.token;

  if (token) {
    let userVerified = await verifyJwt(token);

    if (userVerified) {
      next();
    } else {
      next("User not authenticated. Not verified.");
    }
  } else {
    next("User not authenticated. No token found.");
  }
}
