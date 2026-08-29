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

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer") {
      return res.status(401).json({
        success: false,
        message: "Authorization header must use the Bearer scheme.",
      });
    }
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
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized access." });
  }
};

// Optional Auth Middleware
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, appConfig.JWTSecret);

    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    return next();
  }
};
