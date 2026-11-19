import express from "express";
import Gift from "../models/gift.model.js";
import Wishlist from "../models/wishlist.model.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Get the signed-in user's wishlist
router.get("/", async (req, res, next) => {
  try {
    const gifts = await Wishlist.listByUser(req.user.id);
    return res.status(200).json({ success: true, gifts });
  } catch (error) {
    next(error);
  }
});

// Add a gift to the wishlist
router.post("/add", async (req, res, next) => {
  try {
    const { giftId } = req.body;

    if (!Gift.isValidId(giftId)) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a valid gift id." });
    }

    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res
        .status(404)
        .json({ success: false, message: "Gift not found" });
    }

    const added = await Wishlist.add(req.user.id, giftId);

    return res.status(added ? 201 : 200).json({
      success: true,
      message: added
        ? "Gift added to your wishlist"
        : "This gift is already in your wishlist",
    });
  } catch (error) {
    next(error);
  }
});

// Remove a gift from the wishlist
router.delete("/remove-from-wishlist/:giftId", async (req, res, next) => {
  try {
    const { giftId } = req.params;

    if (!Gift.isValidId(giftId)) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a valid gift id." });
    }

    const removed = await Wishlist.remove(req.user.id, giftId);
    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "This gift is not in your wishlist.",
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "Gift removed from your wishlist" });
  } catch (error) {
    next(error);
  }
});

export const wishlistRoutes = router;
