import { appConfig } from "../config/appConfig.js";
import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header not provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided in headers." });
    }

    const decoded = jwt.verify(token, appConfig.JWTSecret);

    if (!decoded || !decoded.id) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token." });
    }

    req.user = { id: decoded.id };
    next();
  } catch (error) {
    console.error("Error in authMiddleware:", error);
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access." });
  }
};
