import { User } from "../../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: User; // 👈 add your user type here
    }
  }
}
