import { Request, Response } from "express";

export async function authenticateTwitch(req: Request, res: Response): Promise<void> {
  try {
    const csrfState = Math.random().toString(36).substring(2);
    const redirectUri = process.env.TWITCH_REDIRECT_URI!;

    const url =
      `https://id.twitch.tv/oauth2/authorize?` +
      `client_id=${process.env.TWITCH_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=user:read:email` + // required scope for email
      `&state=${csrfState}`;

    res.redirect(url);
  } catch (e) {
    console.error("Twitch auth start failed:", e);
    res.status(400).json({ error: "Can't authenticate with Twitch" });
  }
}
