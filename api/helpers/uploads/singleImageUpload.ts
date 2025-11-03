import multer from "multer";
import storage from "./storage";

const singleImageUpload = multer({
  storage,
  limits: { fileSize: 3 * 1_048_576 }, // 3MB
  fileFilter: async (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpeg" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/webp"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      const err = new Error("Invalid format!");
      err.name = "ExtensionError";
      return cb(err);
    }
  },
}).single("image");

export default singleImageUpload;
