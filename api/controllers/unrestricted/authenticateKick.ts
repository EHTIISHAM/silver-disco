// import { Request, Response } from "express";
// import * as arctic from "arctic";

// // Extend session to include PKCE + state
// declare module "express-session" {
//   interface SessionData {
//     codeVerifier?: string;
//     kickState?: string;
//   }
// }

// // Initialize Kick OAuth client
// const kick = new arctic.Kick(
//   process.env.KICK_CLIENT_ID!,
//   process.env.KICK_CLIENT_SECRET!,
//   process.env.KICK_REDIRECT_URI!
// );

// /**
//  * Step 1: Redirect user to Kick’s OAuth screen
//  */
// export async function authenticateKick(req: Request, res: Response): Promise<void> {
//   try {
//     const state = arctic.generateState();
//     const codeVerifier = arctic.generateCodeVerifier(); // PKCE

//     req.session.kickState = state;
//     req.session.codeVerifier = codeVerifier;

//     console.log("[Kick OAuth] Generated state:", state);
//     console.log("[Kick OAuth] Generated codeVerifier:", codeVerifier);

//     // ✅ Request proper OpenID scopes
//     const url = kick.createAuthorizationURL(state, codeVerifier, [
//       "openid",
//       "profile",
//       "email"
//     ]);

//     console.log("[Kick OAuth] Redirecting user to Kick:", url.toString());
//     res.redirect(url.toString());
//   } catch (err) {
//     console.error("[Kick OAuth start error]:", err);
//     res.status(500).json({ error: "Cannot authenticate with Kick", details: err });
//   }
// }








// import * as arctic from "arctic";
// import { Request, Response } from "express";
// import User from "../../models/User";
// import createJwt from "../../helpers/auth/createJwt";

// // 👇 Extend session to include custom fields
// declare module "express-session" {
//   interface SessionData {
//     codeVerifier?: string;
//     kickState?: string;
//   }
// }

// // Initialize Kick OAuth client
// const kick = new arctic.Kick(
//   process.env.KICK_CLIENT_ID!,
//   process.env.KICK_CLIENT_SECRET!,
//   process.env.KICK_REDIRECT_URI!
// );

// /**
//  * Step 1: Redirect user to Kick’s OAuth screen
//  */
// export async function authenticateKick(req: Request, res: Response): Promise<void> {
//   try {
//     const state = arctic.generateState();
//     const codeVerifier = arctic.generateCodeVerifier(); // PKCE

//     // Store in session
//     req.session.kickState = state;
//     req.session.codeVerifier = codeVerifier;

//     console.log("[Kick OAuth] Generated state:", state);
//     console.log("[Kick OAuth] Generated codeVerifier:", codeVerifier);

//     // Generate auth URL
//     const url = kick.createAuthorizationURL(state, codeVerifier, ["user:read"]);
//     console.log("[Kick OAuth] Redirecting user to Kick:", url.toString());

//     res.redirect(url.toString());
//   } catch (err) {
//     console.error("[Kick OAuth start error]:", err);
//     res.status(500).json({ error: "Cannot authenticate with Kick", details: err });
//   }
// }

// /**
//  * Step 2: Handle redirect from Kick & login user
//  */
// export async function kickRedirect(req: Request, res: Response): Promise<void | Response> {
//   try {
//     const { code, state } = req.query;
//     const storedVerifier = req.session?.codeVerifier;
//     const storedState = req.session?.kickState;

//     console.log("[Kick Redirect] Incoming query params:", req.query);
//     console.log("[Kick Redirect] Stored session state:", storedState);
//     console.log("[Kick Redirect] Stored codeVerifier:", storedVerifier);

//     if (!code || !storedVerifier || !state || state !== storedState) {
//       console.warn("[Kick Redirect] Invalid request - missing or mismatched params");
//       return res.status(400).json({ error: "Invalid OAuth request" });
//     }

//     // Exchange code for tokens safely
//     let tokens: any;
//     try {
//       tokens = await kick.validateAuthorizationCode(code as string, storedVerifier);
//       if (!tokens || typeof tokens.accessToken !== "function") {
//         throw new Error("Kick returned invalid token response");
//       }
//       console.log("[Kick Redirect] Token exchange successful:", tokens);
//     } catch (err: any) {
//       console.error("[Kick Redirect] Token exchange failed:", err);
//       return res.status(400).json({
//         msg: "Kick token exchange failed",
//         error: err?.message || err,
//       });
//     }

//     const accessToken = tokens.accessToken();
//     console.log("[Kick Redirect] Access token acquired:", accessToken);

//     // Fetch Kick user profile safely
//     let userData: any;
//     try {
//       const userRes = await fetch("https://kick.com/api/v2/user", {
//         headers: { Authorization: `Bearer ${accessToken}` },
//       });

//       const raw = await userRes.text();
//       if (!userRes.ok) {
//         console.error("[Kick Redirect] Failed to fetch user profile:", raw);
//         return res.status(400).json({
//           msg: "Failed to fetch Kick user profile",
//           status: userRes.status,
//           raw,
//         });
//       }

//       try {
//         userData = JSON.parse(raw);
//       } catch {
//         console.error("[Kick Redirect] Kick returned invalid JSON:", raw);
//         return res.status(400).json({
//           msg: "Kick returned invalid JSON for user profile",
//           raw,
//         });
//       }

//       console.log("[Kick Redirect] Kick user data received:", userData);
//     } catch (err: any) {
//       console.error("[Kick Redirect] Error fetching user profile:", err);
//       return res.status(500).json({ msg: "Error fetching Kick profile", error: err.message || err });
//     }

//     // Create or fetch user from DB
//     const email = `${userData.username}@kick.com`;
//     let user = await User.findOne({ email });

//     if (!user) {
//       user = await User.create({
//         username: userData.username,
//         email,
//         pfp: userData.profile_picture || null,
//       });
//       console.log("[Kick Redirect] Created new user:", user.username);
//     } else {
//       console.log("[Kick Redirect] Found existing user:", user.username);
//     }

//     // Issue JWT and set secure cookie
//     const token = await createJwt(user._id.toString());
//     res.cookie("token", token, {
//       httpOnly: true,
//       sameSite: "lax",
//       secure: process.env.NODE_ENV === "production", // secure in prod
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     // Clear session PKCE/state after use
//     delete req.session.kickState;
//     delete req.session.codeVerifier;

//     console.log("[Kick Redirect] Login successful, redirecting user...");
//     res.redirect(`${process.env.CLIENT_URL}/home`);
//   } catch (err: any) {
//     console.error("[Kick OAuth callback error]:", err);
//     res.status(500).json({
//       msg: "Kick OAuth failed",
//       error: err?.message || err,
//     });
//   }
// }








// import * as arctic from "arctic";
// import { Request, Response } from "express";
// import User from "../../models/User";
// import createJwt from "../../helpers/auth/createJwt";

// // Kick app initialization
// const kick = new arctic.Kick(
//   process.env.KICK_CLIENT_ID!,
//   process.env.KICK_CLIENT_SECRET!,
//   process.env.KICK_REDIRECT_URI!
// );

// // Step 1: Redirect user to Kick’s OAuth screen
// export async function authenticateKick(req: Request, res: Response): Promise<void> {
//   try {
//     const state = arctic.generateState();
//     const codeVerifier = arctic.generateCodeVerifier(); // PKCE verifier
//     req.session!.codeVerifier = codeVerifier; // store in session

//     console.log("[Kick OAuth] Generated state:", state);
//     console.log("[Kick OAuth] Code verifier:", codeVerifier);

//     // build auth URL
//     const url = kick.createAuthorizationURL(state, codeVerifier, ["user:read"]);
//     console.log("[Kick OAuth] Redirecting user to:", url.toString());

//     res.redirect(url.toString());
//   } catch (err) {
//     console.error("[Kick OAuth start error]:", err);
//     res.status(500).json({ error: "Cannot authenticate with Kick" });
//   }
// }

// // Step 2: Exchange code for tokens and login
// export async function kickRedirect(
//   req: Request,
//   res: Response
// ): Promise<void | Response> {
//   console.log("[Kick Redirect] Query params:", req.query);

//   try {
//     const { code } = req.query;
//     const storedVerifier = req.session?.codeVerifier;

//     console.log("[Kick Redirect] Received code:", code);
//     console.log("[Kick Redirect] Stored PKCE verifier:", storedVerifier);

//     if (!code || !storedVerifier) {
//       console.warn("[Kick Redirect] Missing code or PKCE verifier");
//       return res.status(400).json({ error: "Missing code or PKCE verifier" });
//     }

//     // Exchange code for tokens
//     console.log("[Kick Redirect] Exchanging code for tokens...");
//     const tokens = await kick.validateAuthorizationCode(
//       code as string,
//       storedVerifier
//     );

//     console.log("[Kick Redirect] Token response object:", tokens);
//     const accessToken = tokens.accessToken();
//     console.log("[Kick Redirect] Access token:", accessToken);

//     // Fetch user profile
//     console.log("[Kick Redirect] Fetching Kick user profile...");
//     const userRes = await fetch("https://api.kick.com/public/v1/users", {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });

//     console.log("[Kick Redirect] User response status:", userRes.status);
//     const userData = await userRes.json();
//     console.log("[Kick Redirect] User data response:", userData);

//     // Create or find user
//     let user =
//       (await User.findOne({ email: userData.username + "@kick.com" })) ||
//       (await User.create({
//         username: userData.username,
//         email: userData.username + "@kick.com",
//         pfp: userData.profile_picture,
//       }));

//     console.log("[Kick Redirect] User record:", user);

//     // Issue JWT
//     const token = await createJwt(user._id.toString());
//     console.log("[Kick Redirect] Created JWT:", token);

//     res.cookie("token", token, { httpOnly: true });
//     res.redirect(process.env.CLIENT_URL + "/home");
//     } catch (err: any) {
//     console.error("[Kick OAuth callback error]:", err);

//     if (err instanceof Error) {
//         console.error("[Kick OAuth callback error message]:", err.message);
//         console.error("[Kick OAuth callback error stack]:", err.stack);
//     }

//     res.status(500).json({ msg: "Kick OAuth failed", error: err?.message || err });
// }

// }













// import * as arctic from "arctic";
// import { Request, Response } from "express";
// import User from "../../models/User";
// import createJwt from "../../helpers/auth/createJwt";

// // Kick app initialization
// const kick = new arctic.Kick(
//   process.env.KICK_CLIENT_ID!,
//   process.env.KICK_CLIENT_SECRET!,
//   process.env.KICK_REDIRECT_URI!
// );

// // Step 1: Redirect user to Kick’s OAuth screen
// export async function authenticateKick(req: Request, res: Response): Promise<void> {
//   try {
//     const state = arctic.generateState();
//     const codeVerifier = arctic.generateCodeVerifier(); // PKCE verifier
//     req.session!.codeVerifier = codeVerifier; // store in session

//     // build auth URL
//     const url = kick.createAuthorizationURL(state, codeVerifier, ["user:read"]);
//     res.redirect(url.toString());
//   } catch (err) {
//     console.error("Kick OAuth start error:", err);
//     res.status(500).json({ error: "Cannot authenticate with Kick" });
//   }
// }

// // Step 2: Exchange code for tokens and login
// export async function kickRedirect(
//   req: Request,
//   res: Response
// ): Promise<void | Response> {

//   try {
//     const { code } = req.query;
//     const storedVerifier = req.session?.codeVerifier;

//     if (!code || !storedVerifier) {
//       return res.status(400).json({ error: "Missing code or PKCE verifier" });
//     }

//     // Exchange code for tokens
//     const tokens = await kick.validateAuthorizationCode(
//       code as string,
//       storedVerifier
//     );
//     const accessToken = tokens.accessToken();

//     // Fetch user profile
//     const userRes = await fetch("https://api.kick.com/public/v1/users", {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });
//     const userData = await userRes.json();

//     // Create or find user
//     let user =
//       (await User.findOne({ email: userData.username + "@kick.com" })) ||
//       (await User.create({
//         username: userData.username,
//         email: userData.username + "@kick.com",
//         pfp: userData.profile_picture,
//       }));

//     // Issue JWT
//     const token = await createJwt(user._id.toString());
//     res.cookie("token", token, { httpOnly: true });
//     res.redirect(process.env.CLIENT_URL + "/home");
//   } catch (err) {
//     console.error("Kick OAuth callback error:", err);
//     res.status(500).json({ error: "Kick OAuth failed" });
//   }
// }
