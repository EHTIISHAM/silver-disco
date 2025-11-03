import { Request, Response } from "express";

export async function authenticateGoogle(req: Request, res: Response): Promise<void> {
  try {
    const csrfState = Math.random().toString(36).substring(2);
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!; // e.g. https://pinballrace.com:8080/unrestricted/googleRedirect

    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=openid%20email%20profile` +
      `&state=${csrfState}`;

    res.redirect(url);
  } catch (e) {
    console.error("Auth start failed:", e);
    res.status(400).json({ error: "Can't authenticate with Google" });
  }
}
