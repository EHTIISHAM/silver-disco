// import { Request, Response } from "express";
// import User from "../../models/User"; // adjust path
// import createJwt from "../../helpers/auth/createJwt";
// export async function kickRedirect(req: Request, res: Response): Promise<any> {

//   try {
//     const { code, state } = req.query as { code?: string; state?: string };
//     const storedVerifier = req.session?.codeVerifier;
//     const storedState = req.session?.kickState;

//     console.log("[Kick Redirect] Incoming query:", req.query);
//     console.log("[Kick Redirect] Session data:", { storedVerifier, storedState });

//     if (!code || !state || !storedVerifier || state !== storedState) {
//       console.warn("[Kick Redirect] Invalid OAuth request");
//       return res.status(400).send("Invalid OAuth request");
//     }

//     // 1. Exchange code for tokens
//     const params = new URLSearchParams({
//       grant_type: "authorization_code",
//       code,
//       client_id: process.env.KICK_CLIENT_ID!,
//       client_secret: process.env.KICK_CLIENT_SECRET!,
//       redirect_uri: process.env.KICK_REDIRECT_URI!,
//       code_verifier: storedVerifier,
//     });

//     const tokenResp = await fetch("https://id.kick.com/oauth/token", {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: params,
//     });

//     const tokenText = await tokenResp.text();
//     console.log("[Kick Redirect] Token response:", tokenResp.status, tokenText);

//     if (!tokenResp.ok) {
//       return res.status(400).send("Token exchange failed: " + tokenText);
//     }

//     const tokenData = JSON.parse(tokenText);
//     const accessToken = tokenData.access_token;

//     // 2. Fetch Kick user profile (OpenID `userinfo`)
//     const userResp = await fetch("https://id.kick.com/oauth/userinfo", {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });

//     const userText = await userResp.text();
//     console.log("[Kick Redirect] User response:", userResp.status, userText);

//     if (!userResp.ok) {
//       return res.status(400).send("Failed to fetch Kick user: " + userText);
//     }

//     const userData = JSON.parse(userText);

//     // 3. Normalize fields
//     const email =
//       userData.email ||
//       `${userData.preferred_username || userData.sub}@kick.com`;
//     const username =
//       userData.preferred_username || userData.username || "kick_user";
//     const avatar = userData.picture || null;

//     // 4. Create or update user in DB
//     let user = await User.findOne({ email });
//     if (user) {
//       user.clientToken = accessToken;
//       await user.save();
//       console.log("[Kick Redirect] Existing user logged in:", user.username);
//     } else {
//       user = await User.create({
//         username,
//         email,
//         pfp: avatar,
//         clientToken: accessToken,
//       });
//       console.log("[Kick Redirect] New user created:", user.username);
//     }

//     // 5. Issue JWT
//     const token = await createJwt(user._id.toString());
//     res.cookie("token", token, {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });

//     // Cleanup session
//     delete req.session.kickState;
//     delete req.session.codeVerifier;

//     console.log("[Kick Redirect] Login successful, redirecting...");
//     res.redirect(`${process.env.CLIENT_URL}/home`);
//   } catch (err) {
//     console.error("[Kick Redirect] Error:", err);
//     res
//       .status(500)
//       .json({ error: "Kick OAuth failed", details: (err as Error).message });
//   }
// }









// import dotenv from "dotenv";
// import { Request, Response } from "express";
// import User from "../../models/User";
// import createJwt from "../../helpers/auth/createJwt";
// dotenv.config();

// export async function kickRedirect(req: Request, res: Response): Promise<void> {
//   if (!("error" in req.query) && "code" in req.query && "state" in req.query) {
//     console.log("Kick env direct test:", process.env.KICK_CLIENT_ID);

//     try {
//       const content = new URLSearchParams();
//       content.append("code", req.query.code as string);
//       content.append("client_id", process.env.KICK_CLIENT_ID!);
//       content.append("client_secret", process.env.KICK_CLIENT_SECRET!);
//       content.append("grant_type", "authorization_code");
//       content.append("redirect_uri", process.env.KICK_REDIRECT_URI!);

//       // 1. Exchange code for tokens
//       const tokenResponse = await fetch("https://id.kick.com/oauth/token", {
//         method: "POST",
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: content,
//       });

//       const tokenData = await tokenResponse.json();

//       if (!tokenData.error && tokenData.access_token) {
//         try {
//           // 2. Fetch Kick user info
//           const userResponse = await fetch("https://api.kick.com/public/v1/users", {
//             method: "GET",
//             headers: { Authorization: `Bearer ${tokenData.access_token}` },
//           });

//           const userData = await userResponse.json();

//           if (userData && userData.data?.username) {
//             const email = userData.data.email || `${userData.data.username}@kick.com`; 
//             const username = userData.data.username;
//             const avatar = userData.data.profile_picture;

//             // 3. Check if user exists
//             let user = await User.findOne({ email });

//             if (user) {
//               user.clientToken = tokenData.access_token;
//               user.refreshToken = tokenData.refresh_token;
//               await user.save();
//             } else {
//               user = await User.create({
//                 csrfToken: req.query.state,
//                 clientToken: tokenData.access_token,
//                 refreshToken: tokenData.refresh_token,
//                 consented: false,
//                 username,
//                 email,
//                 pfp: avatar,
//               });
//             }

//             // 4. Issue JWT
//             const token = await createJwt(user._id.toString());
//             res.cookie("token", token, {
//               httpOnly: true,
//               secure: process.env.NODE_ENV === "production",
//               sameSite: "lax",
//             });

//             res.redirect(process.env.CLIENT_URL + "/home");
//           } else {
//             console.error("Kick userData error:", userData);
//             res.status(400).json({ msg: "Failed to fetch Kick user info" });
//           }
//         } catch (e) {
//           console.error("Kick user fetch error:", e);
//           res.status(400).json({ msg: "Error while fetching Kick user" });
//         }
//       } else {
//         console.error("Kick token error:", tokenData);
//         res.status(400).json({ msg: "Something went wrong in Kick token" });
//       }
//     } catch (err) {
//       console.error("Kick OAuth error:", err);
//       res.status(400).json();
//     }
//   } else {
//     res.status(400).json({ msg: "Missing required query params" });
//     console.log("Kick redirect query:", req.query);
//   }
// }
