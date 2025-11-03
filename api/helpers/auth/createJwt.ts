import { sign } from "jsonwebtoken";

export default async function (userId: String): Promise<string> {
  const secretKey = process.env.JWT_SECRET_KEY;

  if (secretKey) {
    return new Promise((resolve, reject) => {
      sign(
        { _id: userId },
        secretKey,
        { algorithm: "HS256", expiresIn: "2d" },
        function (err, token) {
          if (token) {
            resolve(token);
          } else {
            return reject(err);
          }
        }
      );
    });
  } else {
    throw "Something went wrong with JWTs.";
  }
}
