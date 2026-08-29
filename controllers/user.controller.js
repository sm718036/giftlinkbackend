import { appConfig } from "../config/appConfig.js";
import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = appConfig.JWTSecret;

export const getMe = async (req, res) => {
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
};

export const registerNewUser = async (req, res) => {
  const { email, firstName, lastName, password } = req.body;

  if (![email, firstName, lastName, password].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const hash = await bcryptjs.hash(password, 10);

    await User.create({
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password: hash,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please login.",
    });
  } catch (error) {
    console.error("Error in /register:", error);
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const loginExistingUser = async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }
  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
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
    const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      authtoken,
    });
  } catch (error) {
    console.error("Error in /login:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExistingUser = async (req, res) => {
  const { firstName, lastName } = req.body;

  if (![firstName, lastName].every((value) => typeof value === "string" && value.trim())) {
    return res.status(400).json({ success: false, message: "First and last name are required" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { firstName: firstName.trim(), lastName: lastName.trim() },
      { new: true, runValidators: true }
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
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !currentPassword ||
    !newPassword
  ) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters",
    });
  }

  try {
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hash = await bcryptjs.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error in change password:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
