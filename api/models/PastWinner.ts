import { Schema, model } from "mongoose";
import { PastWinners } from "../ts/ModelInterfaces/PastWinner";
import generateDataAccessToken from "../helpers/races/generateDataAccessToken";
import Tokens from "./Tokens";
import { connect } from "socket.io-client";
import { readFileSync } from "fs";

const schema = new Schema<PastWinners>({
  username: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: false },
  prize: { type: String, required: true },
  gameId: { type: String, required: true },
  gameType: { type: String, required: true },
  token: { type: String, required: true },
  createdAt: { type: Number, default: Date.now(), required: true },
});

schema.post("findOneAndUpdate", async function (result, next) {
  try {
    const token = await generateDataAccessToken(result._id.toString());

    const tokenInsert = await Tokens.create({
      token: token,
    });

    if (tokenInsert) {
      if (process.env.environment) {
        if (process.env.environment === "Development") {
          connect(`${process.env.WS_URL}/games`, {
            auth: {
              dataAccessToken: token,
            },
            forceNew: true,
          });
        } else if (process.env.environment === "Production") {
          if (process.env.TLS && process.env.TLS_KEY) {
            connect(`${process.env.WS_URL}/games`, {
              auth: {
                dataAccessToken: token,
              },
              forceNew: true,
              cert: readFileSync(process.env.TLS).toString(),
              key: readFileSync(process.env.TLS_KEY).toString(),
              rejectUnauthorized: false,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  next();
});

const PastWinners = model<PastWinners>("PastWinners", schema);

export default PastWinners;
