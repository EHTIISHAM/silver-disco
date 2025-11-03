import { Schema, model } from "mongoose";
import { Tokens } from "../ts/ModelInterfaces/Tokens";

const schema = new Schema<Tokens>({
  token: { type: String, required: true },
  used: { type: Boolean, required: true, default: false },
  createdAt: { type: Number, default: Date.now(), required: true },
});

const Tokens = model<Tokens>("Tokens", schema);

export default Tokens;
