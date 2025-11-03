import { Schema, model } from "mongoose";
import { Race } from "../ts/ModelInterfaces/Race";
import generateDataAccessToken from "../helpers/races/generateDataAccessToken";
import Tokens from "./Tokens";
import { connect } from "socket.io-client";
import { readFileSync } from "fs";

const schema = new Schema<Race>({
  status: {
    type: String,
    enum: ["Unfinished", "Finished"],
    default: "Unfinished",
  },
  gameId: {
    type: String,
    required: true,
  },
  winners: { type: [], default: [], required: true },
  timer: { type: Number, required: true },
  typedBalls: {
    type: String,
    required: false,
  },
  startedAt: { type: Number, default: Date.now() },
  endedAt: { type: Number },
});

schema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const token = await generateDataAccessToken(this._id.toString());

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
    }
  } catch (e) {
    console.error(e);
  }

  next();
});

schema.post("findOneAndDelete", async function (result, next) {
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

const Race = model<Race>("races", schema);

export default Race;
