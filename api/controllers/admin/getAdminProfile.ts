// import { Request, Response } from "express";
// import User from "../../models/User";
// import { decode } from "jsonwebtoken";

// export async function getAdminProfile(
//   req: Request,
//   res: Response
// ): Promise<void> {
//   try {
//     const decodedPayload: any = decode(req.cookies.adminToken);

//     // FIX: Extract the _id property from the decoded payload
//     const userId = decodedPayload?._id;

//     if (userId) {
//       const user = await User.findOne({ _id: userId })
//         .select("-password") // Added to exclude password for security
//         .select("-csrfToken")
//         .select("-clientToken")
//         .select("-refreshToken")
//         .select("-consented");

//       // Check if user was found before responding
//       if (user) {
//         res.json(user);
//       } else {
//         res.status(404).json({ msg: "Admin user not found." });
//       }
//     } else {
//       res.status(401).json({ msg: "Authentication token is invalid or missing user ID." });
//     }
//   } catch (error) {
//     console.error("Error in getAdminProfile:", error);
//     res.status(500).json({ msg: "Internal Server Error" });
//   }
// }




import { Request, Response } from "express";
import User from "../../models/User";
import { decode } from "jsonwebtoken";

export async function getAdminProfile(
  req: Request,
  res: Response
): Promise<void> {
  const userId = decode(req.cookies.token);

  if (userId) {
    const user = await User.findOne({ _id: userId })
      .select("-csrfToken")
      .select("-clientToken")
      .select("-refreshToken");
      //.select("-consented");

    res.json(user);
  }
}

