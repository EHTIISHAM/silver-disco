import { Request, Response } from "express";

export async function authenticateTiktok(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if ("token" in req.body) {
      res.status(400).json({ error: "Can't authenticated with TikTok" });
    } else {
      const csrfState = Math.random().toString(36).substring(2);

      res.redirect(
        `https://www.tiktok.com/v2/auth/authorize?client_key=${process.env.clientKey}&response_type=code&scope=user.info.basic&redirect_uri=https://pinballrace.com:8080/redirect&state=${csrfState}`
      );
    }
  } catch (e) {
    res.status(400).json({ error: "Can't authenticated with TikTok" });
  }
}
