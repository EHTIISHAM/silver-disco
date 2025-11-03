import { Request, Response } from "express";
import multer from "multer";
import singleImageUpload from "../../helpers/uploads/singleImageUpload";
import Prize from "../../models/Prize";

export async function uploadPrizeImage(
  req: Request,
  res: Response
): Promise<void> {
  singleImageUpload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      res
        .status(500)
        .send({
          error: { message: `Multer uploading error: ${err.message}` },
        })
        .end();
      return;
    } else if (err) {
      if (err.name == "ExtensionError") {
        res
          .status(413)
          .send({ error: { message: err.message } })
          .end();
      } else {
        res
          .status(500)
          .send({
            error: { message: `unknown uploading error: ${err.message}` },
          })
          .end();
      }
      return;
    }

    try {
      const file = req.file as Express.Multer.File;

      if ("prizeId" in req.body) {
        const { prizeId } = req.body;

        if (req.file && prizeId) {
          await Prize.findOneAndUpdate(
            {
              _id: req.body.prizeId,
            },
            {
              image: req.file.filename,
            }
          );
        } else {
          res.status(400).json({ error: "Something went wrong." });
        }
      } else {
        res.status(400).json({ error: "Something went wrong." });
      }
    } catch (e) {
      res.status(400).json({ error: "Something went wrong." });
      console.error(e);
    }
  });
}
