/*jshint esversion: 8 */
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getAllGifts,
  getGiftById,
  searchGifts,
  getMyGifts,
  createGift,
  updateGift,
  deleteGift,
} from "../controllers/gift.controller.js";

const router = express.Router();

// Get all gifts
router.get("/", getAllGifts);

// Search for gifts
router.get("/search", searchGifts);

// Get current user's gifts
router.get("/my", authMiddleware, getMyGifts);

// Create a new gift
router.post("/", authMiddleware, createGift);

// Get a single gift by ID
router.get("/:id", authMiddleware, getGiftById);

// Update a gift
router.patch("/:id", authMiddleware, updateGift);

// Delete a gift
router.delete("/:id", authMiddleware, deleteGift);

export const giftRoutes = router;
