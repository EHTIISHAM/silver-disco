import multer from "multer";
import path from "path";

export default multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads/"));
  },
  filename: function (req, file, cb) {
    if ("originalname" in file) {
      if (file.originalname) {
        let matched = file.originalname.match(/\..*$/);

        if (matched) {
          cb(null, file.fieldname + "-" + Date.now() + matched[0]);
        }
      }
    }
  },
});
