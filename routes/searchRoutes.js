import express from "express";
import Gift from "../models/gift.model.js";

const router = express.Router();

// Search for gifts
router.get("/", async (req, res, next) => {
  try {
    // Initialize the query object
    let query = {};

    // check if the name exists and is not empty
    if (req.query.name && req.query.name.trim() !== "") {
      query.name = { $regex: req.query.name, $options: "i" }; // Using regex for partial match, case-insensitive
    }

    // Add other filters to the query
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.condition) {
      query.condition = req.query.condition;
    }
    if (req.query.age_years) {
      query.age_years = { $lte: parseInt(req.query.age_years) };
    }

    // Fetch filtered gifts
    const gifts = await Gift.find(query).toArray();
    res.status(201).json(gifts);
  } catch (e) {
    next(e);
  }
});

export const searchRoutes = router;
