/*jshint esversion: 8 */
import express from "express";
import { authMiddleware } from "./../middlewares/authMiddleware.js";
import {
  registerNewUser,
  getMe,
  loginExistingUser,
  updateExistingUser,
  changePassword,
} from "../controllers/user.controller.js";

const router = express.Router();

// POST /register
router.post("/register", registerNewUser);

// POST /login
router.post("/login", loginExistingUser);

// GET /me
router.get("/me", authMiddleware, getMe);

// PUT /update
router.put("/update", authMiddleware, updateExistingUser);

// PUT /change-password
router.put("/change-password", authMiddleware, changePassword);

export const authRoutes = router;
