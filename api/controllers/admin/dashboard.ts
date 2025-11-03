import { Request, Response } from "express";

export async function dashboard(req: Request, res: Response): Promise<void> {
  res.json({ msg: "sup" });
}
