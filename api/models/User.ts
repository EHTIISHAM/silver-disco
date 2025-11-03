import { Schema, model } from "mongoose";
import { User } from "../ts/ModelInterfaces/User";

const schema = new Schema<User>({
  userType: { type: String, default: "User", required: true },
  email: { type: String, required: false, unique: true, sparse: true },
  username: { type: String, required: false },
  password: { type: String, required: false },
  pfp: { type: String, required: false },
  csrfToken: { type: String, required: false }, // SHOULD BE REQUIRED IN PROD
  clientToken: { type: String, required: false, unique: true, sparse: true },
  refreshToken: { type: String, required: false, unique: true, sparse: true },
  consented: { type: Boolean, default: true, required: false },
  points: { type: Number, default: 0, required: true },
  numberOfWins: { type: Number, default: 0, required: true },
  createdAt: { type: Number, default: Date.now() },
  googleId: String,
  tiktokId: String,
  twitchId: String,
  
  connectedAccounts: {
    google: { type: Boolean, default: false },
    tiktok: { type: Boolean, default: false },
    twitch: { type: Boolean, default: false },
  },
  
});

const User = model<User>("users", schema);

export default User;
