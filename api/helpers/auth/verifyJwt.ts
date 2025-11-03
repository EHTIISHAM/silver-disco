import { verify, JwtPayload } from "jsonwebtoken";

interface DecodedToken extends JwtPayload {
  userId: string;
}

export default async function verifyJwt(token: string): Promise<DecodedToken | null> {
  const secretKey = process.env.JWT_SECRET_KEY;
  if (!secretKey) throw new Error("❌ Missing JWT secret key");

  return new Promise((resolve) => {
    verify(token, secretKey, (err, decoded) => {
      if (err || !decoded) {
        resolve(null);
      } else {
        resolve(decoded as DecodedToken);
      }
    });
  });
}







// import { verify } from "jsonwebtoken";

// export default async function (token: string): Promise<boolean> {
//   const secretKey = process.env.JWT_SECRET_KEY;

//   if (secretKey) {
//     return new Promise((resolve, reject) => {
//       verify(token, secretKey, function (err, token) {
//         if (token) {
//           resolve(true);
//         } else {
//           resolve(false);
//         }
//       });
//     });
//   } else {
//     throw "Something went wrong with JWTs.";
//   }
// }
