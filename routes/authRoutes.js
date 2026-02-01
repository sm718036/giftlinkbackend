/*jshint esversion: 8 */
import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { appConfig } from "../config/appConfig.js";
import { authMiddleware } from "./../middlewares/authMiddleware.js";

const router = express.Router();
const JWT_SECRET = appConfig.JWTSecret;

// GET /me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -__v");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error in /me:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /register
router.post("/register", async (req, res) => {
  const { email, firstName, lastName, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hash = await bcryptjs.hash(password, 10);

    await User.create({
      email,
      firstName,
      lastName,
      password: hash,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please login.",
    });
  } catch (error) {
    console.error("Error in /register:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No user found with this email." });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials." });
    }

    const payload = { id: user._id.toString() };
    const authtoken = jwt.sign(payload, JWT_SECRET);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      authtoken,
    });
  } catch (error) {
    console.error("Error in /login:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /update
router.put("/update", authMiddleware, async (req, res) => {
  const { firstName, lastName } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error in /update:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

export const authRoutes = router;
