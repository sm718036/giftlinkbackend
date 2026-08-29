/*jshint esversion: 8 */
import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  getMyWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getMyWishlist);
router.post("/add", authMiddleware, addToWishlist);
router.delete(
  "/remove-from-wishlist/:giftId",
  authMiddleware,
  removeFromWishlist
);

export const wishlistRoutes = router;
