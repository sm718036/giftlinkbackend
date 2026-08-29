/*jshint esversion: 8 */
import express from "express";
import { authMiddleware, optionalAuth } from "../middlewares/authMiddleware.js";
import {
  getAllGifts,
  getGiftById,
  searchGifts,
  getMyGifts,
  postNewGift,
  updateGift,
  deleteGift,
} from "../controllers/gift.controller.js";

const router = express.Router();

// Get all gifts
router.get("/", optionalAuth, getAllGifts);

// Search for gifts
router.get("/search", optionalAuth, searchGifts);

// Get current user's gifts
router.get("/my-gifts", authMiddleware, getMyGifts);

// Create a new gift
router.post("/post-gift", authMiddleware, postNewGift);

// Get a single gift by ID
router.get("/:id", authMiddleware, getGiftById);

// Update a gift
router.patch("/update/:id", authMiddleware, updateGift);

// Delete a gift
router.delete("/delete/:id", authMiddleware, deleteGift);

export const giftRoutes = router;
