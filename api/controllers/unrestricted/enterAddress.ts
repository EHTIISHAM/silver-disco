import { Request, Response } from "express";
import PastWinners from "../../models/PastWinner";

export async function enterAddress(req: Request, res: Response): Promise<void> {
  try {
    const { secret, address } = req.body;

    if (secret.value != "" && address.value != "") {
      const winner = await PastWinners.findOne({
        token: secret,
        address: "",
      });

      if (winner) {
        await PastWinners.findOneAndUpdate(
          {
            _id: winner._id,
          },
          {
            address: address,
          }
        );

        res.json({});
      } else {
        res.status(400).json({ error: "Please fill out the form completely." });
      }
    } else {
      console.log("warahmatullahi ")
      res.status(400).json({ error: "Please fill out the form completely." });
    }
  } catch (e) {
    console.error(e);
    console.log("wabarakatuh")
    res.status(400).json({ error: "Please fill out the form completely." });
  }
}
