import { sign } from "jsonwebtoken";

export default async function (recordId: String): Promise<string> {
  const secretKey = process.env.JWT_SECRET_KEY;

  if (secretKey) {
    return new Promise((resolve, reject) => {
      sign(
        { _id: recordId },
        secretKey,
        { algorithm: "HS256", expiresIn: 60 },
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
