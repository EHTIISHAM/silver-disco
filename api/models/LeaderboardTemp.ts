import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILeaderboardTemp extends Document {
  username: string;
  pfp: string;
  races: number;
  wins: number;
  points: number;
  datePlayed?: Date;
  type: "simple" | "comps";
  raceId?: string;
}

const leaderboardTempSchema = new Schema<ILeaderboardTemp>({
  username: { type: String, required: true },
  pfp: String,
  races: Number,
  wins: Number,
  points: Number,
  datePlayed: { type: Date, default: Date.now },
  type: { type: String, enum: ["simple", "comps"], required: true },
  raceId: { type: String, required: false },
});

export const LeaderboardTemp: Model<ILeaderboardTemp> =
  mongoose.models.LeaderboardTemp ||
  mongoose.model<ILeaderboardTemp>(
    "LeaderboardTemp",
    leaderboardTempSchema,
    "leaderboard_temp"
  );


