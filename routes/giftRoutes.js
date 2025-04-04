/*jshint esversion: 8 */
import express from "express";
const router = express.Router();
import Gift from "../models/gift.model.js";
import mongoose from "mongoose";
import User from "../models/user.model.js";

// Get all gifts
router.get("/", async (req, res, next) => {
  try {
    const gifts = await Gift.find();
    if (!gifts) return res.status(404).json({ message: "No gifts found" });
    return res.status(201).json(gifts);
  } catch (e) {
    next(e);
  }
});

// Get all gifts by user
router.get("/user/:email", async (req, res, next) => {
  try {
    const email = req.params.email;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const id = user._id;
    const gifts = await Gift.find({ postedBy: id });
    if (!gifts) {
      return res.status(404).json({ message: "No gifts found" }); 
    }
    return res.status(201).json(gifts);
  } catch (e) {
    next(e);
  }
});

// Get a single gift by ID
router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "No gift found" });
    }

    const gift = await Gift.findOne({ _id: id });

    if (!gift) {
      return res.status(404).json({ message: "Gift not found" });
    }

    res.status(201).json(gift);
  } catch (e) {
    next(e);
  }
});

// Add a new gift
router.post("/user/:email", async (req, res, next) => {
  const email = req.headers.email;
  console.log(email)
  const {
    name,
    image,
    description,
    ageInYears,
    condition,
    category,
    postedBy,
    zipCode,
    contactInfo,
  } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }
    const postedByUser = await User.findOne({ email });
    if (!postedByUser) {
      return res.status(400).json({ message: "User not found" });
    }
    const alreadyExists = await Gift.findOne({ name, description, postedBy });
    if (alreadyExists) {
      return res.status(400).json({ message: "Gift already exists" });
    }
    const newGift = await Gift.create({
      name,
      image: image || "/images/filing-cabinet.jpeg",
      description,
      ageInYears,
      condition,
      category,
      postedBy: postedByUser._id,
      zipCode,
      contactInfo,
    });
    await newGift.save();
    res.status(201).json(newGift);
  } catch (e) {
    next(e);
  }
});

export const giftRoutes = router;
