import { Schema, model } from "mongoose";
import { Game } from "../ts/ModelInterfaces/Game";
import generateDataAccessToken from "../helpers/races/generateDataAccessToken";
import Tokens from "./Tokens";
import { connect } from "socket.io-client";
import { readFileSync } from "fs";

const schema = new Schema<Game>({
  status: {
    type: String,
    required: true,
    enum: ["Not Started", "Ongoing", "Finished"],
    default: "Not Started",
  },
  gameType: {
    type: String,
    required: true,
    enum: ["Regular", "Lottery", "Elimination"],
  },
  gameNumber: {
    type: Number,
    required: true,
  },
  numberOfBalls: {
    type: Number,
    required: true,
    default: 12,
  },
  regularBalls: {
    type: Number,
    required: false,
    default: "",
  },
  bonusBalls: {
    type: Number,
    required: false,
    default: "",
  },
  prizeId: {
    type: String,
    required: true,
  },
  timerPerRace: {
    type: String,
    required: true,
  },
  timerTillNextGame: {
    type: String,
    required: true,
  },
  participants: {
    type: [],
    required: true,
    default: [],
  },
  kicked: {
    type: [String],
    required: true,
    default: [],
  },
  attempters: {
    type: [],
    required: true,
    default: [],
  },
  winners: {
    type: [],
    required: true,
    default: [],
  },
  createdAt: { type: Number, default: Date.now() },
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

      this.createdAt = Date.now();
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

const Game = model<Game>("games", schema);

export default Game;
