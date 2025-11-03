import { Schema, model } from "mongoose";
import { Prize } from "../ts/ModelInterfaces/Prize";
import generateDataAccessToken from "../helpers/races/generateDataAccessToken";
import Tokens from "./Tokens";
import { connect } from "socket.io-client";
import { readFileSync } from "fs";

const schema = new Schema<Prize>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true, default: "nofile.png" },
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

const Prize = model<Prize>("prizes", schema);

export default Prize;
