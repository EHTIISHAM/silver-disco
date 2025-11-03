import { verify } from "jsonwebtoken";

export default async function (token: string): Promise<boolean> {
  const secretKey = process.env.JWT_SECRET_KEY;

  if (secretKey) {
    return new Promise((resolve, reject) => {
      verify(token, secretKey, function (err, token) {
        if (token) {
          resolve(true);
        } else {
          reject(false);
        }
      });
    });
  } else {
    throw "Something went wrong with JWTs.";
  }
}
