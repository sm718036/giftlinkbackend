import mongoose from "mongoose";
import Wishlist from "../models/wishlist.model.js";
import Gift from "../models/gift.model.js";

export const getMyWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const wishlistEntries = await Wishlist.find({ user: userId })
      .populate("gift")
      .sort({ createdAt: -1 });

    const gifts = wishlistEntries
      .map((entry) => entry.gift)
      .filter((g) => g != null);

    return res.status(200).json({ success: true, gifts });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { giftId } = req.body;

    if (!giftId) {
      return res
        .status(400)
        .json({ success: false, message: "giftId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(giftId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid gift id" });
    }

    const gift = await Gift.findById(giftId);
    if (!gift) {
      return res
        .status(404)
        .json({ success: false, message: "Gift not found" });
    }

    if (gift.isSample) {
      return res.status(400).json({
        success: false,
        message:
          "Sample gifts are for demonstration only and cannot be claimed or saved",
      });
    }

    if (gift.postedBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot add your own gift to your wishlist",
      });
    }

    if (gift.isTaken) {
      return res.status(400).json({
        success: false,
        message: "This gift is no longer available",
      });
    }

    const existing = await Wishlist.findOne({ user: userId, gift: giftId });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Already in wishlist",
        wishlist: existing,
      });
    }

    const wishlistEntry = await Wishlist.create({ user: userId, gift: giftId });
    return res.status(201).json({ success: true, wishlist: wishlistEntry });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { giftId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(giftId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid gift id" });
    }

    const deleted = await Wishlist.findOneAndDelete({
      user: userId,
      gift: giftId,
    });

    if (!deleted) {
      return res.status(200).json({
        success: true,
        message: "Item was not in wishlist",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Removed from wishlist",
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
