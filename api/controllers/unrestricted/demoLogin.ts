
import { Request, Response } from "express";
import User from "../../models/User";
import { compare } from "bcrypt";
import createJwt from "../../helpers/auth/createJwt";

export async function demoLogin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };

    // validate inputs
    if (!username || !password) {
      res.status(400).json({ error: "Please fill out the form completely." });
      return;
    }

    // find user
    const user = await User.findOne({ username });
    if (!user) {
      res.status(400).json({ error: "User not found." });
      return;
    }

    // check password
    const correctCredentials = await compare(password, user.password);
    if (!correctCredentials) {
      res.status(400).json({ error: "Incorrect credentials." });
      return;
    }

    // create jwt
    const jwt = await createJwt(user._id.toString());

    // set cookie (httpOnly true is recommended for security)
    const cookieName = user.userType === "User" ? "token" : "adminToken";
    res.cookie(cookieName, jwt, {
      httpOnly: true, // security: prevent JS from reading it
      sameSite: "lax", // adjust depending on frontend/backend domain
      secure: process.env.NODE_ENV === "production", // only https in prod
    });

    // success response
    res.json({ type: user.userType });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
}














// import { Request, Response } from "express";
// import User from "../../models/User";
// import { compare } from "bcrypt";
// import createJwt from "../../helpers/auth/createJwt";

// export async function demoLogin(req: Request, res: Response): Promise<void> {
//   try {
//     const { username, password } = req.body;

//     if (username.value != "" && password.value != "") {
//       const user = await User.findOne({ username });

//       if (user) {
//         const correctCredentials = await compare(password, user.password);

//         if (correctCredentials) {
//           const jwt = await createJwt(user._id.toString());

//           user.userType === "User"
//             ? res.cookie("token", jwt, {
//                 httpOnly: false,
//               })
//             : res.cookie("adminToken", jwt, {
//                 httpOnly: false,
//               });

//           res.json({ type: user.userType });
//         } else {
//           res.status(400).json({ error: "Incorrect credentials." });
//         }
//       } else {
//         res
//           .status(400)
//           .json({ error: "Something went wrong, please try again later." });
//       }
//     } else {
//       res.status(400).json({ error: "Please fill out the form completely." });
//     }
//   } catch (e) {
//     console.error(e);
//   }
// }
