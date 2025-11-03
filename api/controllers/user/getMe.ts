import { Request, Response } from "express";
import verifyJwt from "../../helpers/auth/verifyJwt";
import User from "../../models/User";

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies["token"];
    if (!token) {
      res.status(401).json({ msg: "No token found" });
      return;
    }

    const decoded = await verifyJwt(token);
    if (!decoded || !decoded._id) {
      res.status(403).json({ msg: "Invalid or expired token" });
      return;
    }

    const user = await User.findById(decoded._id).lean();
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }

    // ✅ Determine connected accounts dynamically
    const connectedAccounts = {
      google: !!user.googleId || user.connectedAccounts?.google || false,
      tiktok: !!user.tiktokId || user.connectedAccounts?.tiktok || false,
      twitch: !!user.twitchId || user.connectedAccounts?.twitch || false,
    };

    res.json({
      user: {
        username: user.username,
        email: user.email,
        pfp: user.pfp,
        points: user.points || 0,
        numberOfWins: user.numberOfWins || 0,
        connectedAccounts,
      },
    });
  } catch (err) {
    console.error("❌ Error in /me route:", err);
    res.status(500).json({ msg: "Server error" });
  }
}
