import { Request, Response } from "express";
import Game from "../../models/Game";

/**
 * @route   GET /api/games
 * @desc    Get list of all games (with optional filters)
 * @access  Public / Internal use
 */
export const getGames = async (req: Request, res: Response): Promise<void> => {
  try {
    // Optional filters from query params
    const status = req.query.status as string | undefined;     // e.g. "Ongoing"
    const gameType = req.query.type as string | undefined;     // e.g. "Regular"
    const limit = parseInt(req.query.limit as string) || 50;   // default limit = 50
    const sortBy = req.query.sortBy as string || "createdAt";  // sort field
    const order = req.query.order === "asc" ? 1 : -1;          // asc or desc

    // Build query object dynamically
    const filter: any = {};
    if (status) filter.status = status;
    if (gameType) filter.gameType = gameType;

    // Fetch games with optional filters
    const games = await Game.find(filter)
      .sort({ [sortBy]: order })
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: games.length,
      games,
    });
  } catch (error) {
    console.error("❌ Error fetching games:", error);
    res.status(500).json({
      success: false,
      error: "Server error while fetching games",
    });
  }
};
