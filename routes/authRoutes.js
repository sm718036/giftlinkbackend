/*jshint esversion: 8 */
import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { appConfig } from "../config/appConfig.js";
import { authMiddleware } from "./../middlewares/authMiddleware.js";

const router = express.Router();
const JWT_SECRET = appConfig.JWTSecret;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

// GET /me
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// POST /register
router.post("/register", async (req, res, next) => {
  const { firstName, lastName, password } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    if (
      !isNonEmptyString(firstName) ||
      !isNonEmptyString(lastName) ||
      !isNonEmptyString(email) ||
      !isNonEmptyString(password)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide first name, last name, email and password.",
      });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hash = await bcryptjs.hash(password, 10);

    await User.create({
      email,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password: hash,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please login.",
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    next(error);
  }
});

// POST /login
router.post("/login", async (req, res, next) => {
  const { password } = req.body;
  const email = normalizeEmail(req.body.email);

  try {
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const user = await User.findByEmail(email, { includePassword: true });
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

    const payload = { id: String(user._id) };
    const authtoken = jwt.sign(payload, JWT_SECRET);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      authtoken,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /update
router.put("/update", authMiddleware, async (req, res, next) => {
  const { firstName, lastName } = req.body;

  try {
    if (!isNonEmptyString(firstName) || !isNonEmptyString(lastName)) {
      return res.status(400).json({
        success: false,
        message: "Please provide both first name and last name.",
      });
    }

    const updatedUser = await User.updateById(req.user.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

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
    next(error);
  }
});

// PUT /change-password
router.put("/change-password", authMiddleware, async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!isNonEmptyString(currentPassword) || !isNonEmptyString(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Please provide both your current password and a new password.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    const user = await User.findById(req.user.id, { includePassword: true });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect." });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }

    const hash = await bcryptjs.hash(newPassword, 10);
    await User.updatePassword(req.user.id, hash);

    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    next(error);
  }
});

export const authRoutes = router;
