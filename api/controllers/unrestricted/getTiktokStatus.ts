import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

export async function getTiktokStatus(req: Request, res: Response): Promise<void> {
  try {
    const configPath = path.join(process.cwd(), "config", "tiktok.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    const { username, fallbackVideoUrl } = config;

    if (!username) {
      res.status(400).json({ error: "TikTok username missing in config file" });
      return;
    }

    const response = await fetch(`https://www.tiktok.com/@${username}?lang=en`);
    const html = await response.text();

    // Detect if the user is currently live
    const isLive = html.includes('"liveRoom":');

    res.json({
      username,
      isLive,
      liveUrl: `https://www.tiktok.com/@${username}/live`,
      fallbackVideoUrl,
      finalUrl: isLive
        ? `https://www.tiktok.com/@${username}/live`
        : fallbackVideoUrl,
    });
  } catch (error) {
    console.error("Error fetching TikTok live status:", error);
    res.status(500).json({ error: "Failed to fetch TikTok status" });
  }
}
