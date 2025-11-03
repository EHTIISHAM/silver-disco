import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILeaderboard extends Document {
  username: string;
  pfp: string;
  races: number;
  wins: number;
  points: number;
  datePlayed?: Date;
  type: "simple" | "comps";
  raceId?: string;
}

const leaderboardSchema = new Schema<ILeaderboard>({
  username: { type: String, required: true },
  pfp: String,
  races: Number,
  wins: Number,
  points: Number,
  datePlayed: { type: Date, default: Date.now },
  type: { type: String, enum: ["simple", "comps"], required: true },
  raceId: { type: String, required: false },
});

export const Leaderboard: Model<ILeaderboard> =
  mongoose.models.Leaderboard ||
  mongoose.model<ILeaderboard>("Leaderboard", leaderboardSchema, "leaderboard");


