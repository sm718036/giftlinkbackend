/*jshint esversion: 8 */
import express from "express";
const router = express.Router();
import Gift from "../models/gift.model.js";
import mongoose from 'mongoose'

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

// Get a single gift by ID
router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;

    if(!mongoose.Types.ObjectId.isValid(id)){
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
router.post("/", async (req, res, next) => {
  try {
    const gift = await Gift.insertOne(req.body);
    res.status(201).json(gift.ops[0]);
  } catch (e) {
    next(e);
  }
});

export const giftRoutes = router;
