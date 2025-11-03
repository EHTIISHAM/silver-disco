import { Request, Response } from "express";
import Game from "../../models/Game";
import Race from "../../models/Race";
import User from "../../models/User";
import Prize from "../../models/Prize";
import PastWinners from "../../models/PastWinner";
import { 
  sendWebhookNotification, 
  sendRaceNotification, 
  sendGameStatusNotification 
} from "../../helpers/sockets/socketUtils";
import { randomBytes } from "crypto";
import { createTransport } from "nodemailer";
import { readFileSync } from "fs";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "default-webhook-secret";

// Verify webhook signature for security
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");
  
  const expectedHeader = `sha256=${expectedSignature}`;
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedHeader)
    );
  } catch (error) {
    return false;
  }
}

// Send winner notification email
async function sendWinnerEmail(user: any, prize: any, token: string) {
  try {
    let transport;

    if (process.env.environment) {
      if (process.env.environment === "Development") {
        transport = createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
          },
          tls: {
            rejectUnauthorized: false,
          },
          secure: false,
        });
      } else if (process.env.environment === "Production") {
        if (process.env.TLS && process.env.TLS_KEY) {
          transport = createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL,
              pass: process.env.PASSWORD,
            },
            tls: {
              cert: readFileSync(process.env.TLS).toString(),
              key: readFileSync(process.env.TLS_KEY).toString(),
              rejectUnauthorized: false,
            },
            secure: true,
          });
        }
      }
    }

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: `Hey ${user.username}, confirm your address with pinballrace.com to win your ${prize.title}.`,
      text: `To send you the prize you just won at pinballrace.com, we need you to enter in your address so that we can ship it over to you. Please click on this link to go to the address form: ${process.env.CLIENT_URL}/enter_address?secret=${token} . **Note:** If you do not recognize this email or its context, please ignore it, and if possible, report the incident to ${process.env.EMAIL}`,
    };

    if (transport) {
      transport.sendMail(mailOptions, function (error: any, info: any) {
        if (error) {
          console.error("Email error:", error);
        }
      });
    }
  } catch (error) {
    console.error("Error sending winner email:", error);
  }
}

// Process winner and send email
async function processWinner(
  winner: any,
  gameId: string,
  gameType: string,
  prizeId: string
) {
  try {
    const user = await User.findOne({ _id: winner.winnerId });
    const prize = await Prize.findOne({ _id: prizeId });

    if (user && prize) {
      const token = randomBytes(20).toString("hex");

      const pastWinner = await PastWinners.create({
        username: user.username,
        email: user.email,
        address: "",
        prize: prize.title,
        gameId: gameId,
        gameType: gameType,
        token: token,
      });

      if (pastWinner) {
        await sendWinnerEmail(user, prize, token);
      }
    }
  } catch (error) {
    console.error("Error processing winner:", error);
  }
}

export async function gameWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Verify webhook signature
    const signature = req.headers["x-webhook-signature"] as string;
    const payload = JSON.stringify(req.body);

    if (!signature || !verifyWebhookSignature(payload, signature)) {
      res.status(401).json({ error: "Invalid webhook signature" });
      return;
    }

    const {
      gameId,
      raceId,
      winningBalls,
      gameStatus,
      winners,
      eventType,
      timestamp,
    } = req.body;

    // Validate required fields
    if (!gameId || !eventType) {
      res.status(400).json({ error: "Missing required fields: gameId, eventType" });
      return;
    }

    // Find the game
    const game = await Game.findById(gameId);
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    // Process different event types
    switch (eventType) {
      case "race_completed":
        await handleRaceCompleted(gameId, raceId, winningBalls, winners);
        // Send race notification
        await sendRaceNotification({
          raceNumber: raceId ? `#${raceId}` : "Current",
          winningBalls: winningBalls,
          gameId: gameId
        });
        break;

      case "game_finished":
        await handleGameFinished(gameId, winners, gameStatus);
        // Send game status notification
        await sendGameStatusNotification({
          gameNumber: game.gameNumber,
          status: "Finished",
          gameId: gameId
        });
        break;

      case "game_started":
        await handleGameStarted(gameId);
        // Send game status notification
        await sendGameStatusNotification({
          gameNumber: game.gameNumber,
          status: "Ongoing",
          gameId: gameId
        });
        break;

      case "race_started":
        await handleRaceStarted(gameId, raceId);
        // Send race notification
        await sendRaceNotification({
          raceNumber: raceId ? `#${raceId}` : "New",
          message: "Race started",
          gameId: gameId
        });
        break;

      default:
        res.status(400).json({ error: "Unknown event type" });
        return;
    }

    // Send webhook status notification
    await sendWebhookNotification({
      success: true,
      eventType,
      gameId,
      message: `${eventType.replace('_', ' ')} processed successfully`
    });

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      eventType,
      gameId,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    // Send error notification
    await sendWebhookNotification({
      success: false,
      eventType: req.body.eventType || "unknown",
      gameId: req.body.gameId || "unknown",
      message: "Webhook processing failed"
    });
    
    res.status(500).json({ error: "Internal server error" });
  }
}

// Handle race completion
async function handleRaceCompleted(
  gameId: string,
  raceId: string,
  winningBalls: number[],
  winners: any[]
) {
  try {
    const game = await Game.findById(gameId);
    if (!game) return;

    let race;
    if (raceId) {
      race = await Race.findById(raceId);
    } else {
      // Find the most recent unfinished race for this game
      race = await Race.findOne({
        gameId: gameId,
        status: "Unfinished",
      }).sort({ startedAt: -1 });
    }

    if (race) {
      // Update race with results
      await Race.findByIdAndUpdate(race._id, {
        status: "Finished",
        winners: winners || [],
        typedBalls: winningBalls ? winningBalls.join(",") : "",
        endedAt: Date.now(),
      });

      // Update user points for winners
      if (winners && winners.length > 0) {
        for (const winner of winners) {
          const user = await User.findById(winner.winnerId);
          if (user) {
            const points = calculatePoints(game.gameType, winner.position, game.participants?.length || 12);
            await User.findByIdAndUpdate(winner.winnerId, {
              points: user.points + points,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error handling race completion:", error);
  }
}

// Handle game finish
async function handleGameFinished(
  gameId: string,
  winners: any[],
  gameStatus: string
) {
  try {
    const game = await Game.findById(gameId);
    if (!game) return;

    // Update game status
    await Game.findByIdAndUpdate(gameId, {
      status: "Finished",
      winners: winners || [],
      endedAt: Date.now(),
    });

    // Process first place winner for prize
    if (winners && winners.length > 0) {
      const firstPlaceWinner = winners.find(w => w.position === "1");
      if (firstPlaceWinner) {
        await processWinner(firstPlaceWinner, gameId, game.gameType, game.prizeId);
      }
    }
  } catch (error) {
    console.error("Error handling game finish:", error);
  }
}

// Handle game start
async function handleGameStarted(gameId: string) {
  try {
    await Game.findByIdAndUpdate(gameId, {
      status: "Ongoing",
    });
  } catch (error) {
    console.error("Error handling game start:", error);
  }
}

// Handle race start
async function handleRaceStarted(gameId: string, raceId: string) {
  try {
    if (raceId) {
      await Race.findByIdAndUpdate(raceId, {
        status: "Unfinished",
        startedAt: Date.now(),
      });
    }
  } catch (error) {
    console.error("Error handling race start:", error);
  }
}

// Calculate points based on game type and position
function calculatePoints(gameType: string, position: string, totalPlayers: number): number {
  const pos = parseInt(position);
  
  switch (gameType) {
    case "Regular":
      return Math.max(1, totalPlayers - pos + 1);
    case "Elimination":
      return Math.max(1, totalPlayers - pos + 1);
    case "Lottery":
      return pos === 1 ? 20 : 2;
    default:
      return 1;
  }
}
