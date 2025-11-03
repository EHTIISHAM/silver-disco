import { Request, Response } from "express";
import User from "../../models/User";
import { decode } from "jsonwebtoken";

export async function getProfile(req: Request, res: Response): Promise<void> {
  if ("token" in req.cookies) {
    const userId: any = decode(req.cookies.token);

    if (userId) {
      const user = await User.findOne({ _id: userId })
        .select("-csrfToken")
        .select("-clientToken")
        .select("-refreshToken")
        .select("-consented");

      res.json(user);
    }
  }
}
