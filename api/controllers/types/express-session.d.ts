import "express-session";

declare module "express-session" {
  interface SessionData {
    codeVerifier?: string;
    state?: string;
  }
}
