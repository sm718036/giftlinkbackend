/*jshint esversion: 8 */
import express from "express";
import mongoose from "mongoose";
import Gift from "../models/gift.model.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Get all gifts
router.get("/", async (req, res) => {
  let { currentPage, limit } = req.query;

  try {
    currentPage = parseInt(currentPage, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const result = await Gift.aggregate([
      {
        $facet: {
          metadata: [{ $count: "totalCount" }],
          data: [{ $skip: (currentPage - 1) * limit }, { $limit: limit }],
        },
      },
    ]);

    if (!result || !result[0].data.length) {
      return res
        .status(200)
        .json({ success: true, message: "No gifts found", gifts: [] });
    }

    const totalCount = result[0].metadata[0]?.totalCount || 0;
    const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;
    const gifts = result[0].data;

    return res.status(200).json({
      success: true,
      metaData: {
        totalCount,
        totalPages,
        currentPage,
        limit,
      },
      gifts,
    });
  } catch (error) {
    console.error("Error fetching all gifts:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Search for gifts
router.get("/search", async (req, res) => {
  let { name, category, condition, ageInYears, currentPage, limit } = req.query;
  try {
    currentPage = parseInt(currentPage, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (ageInYears) query.age_years = { $lte: parseInt(ageInYears, 10) };

    const result = await Gift.aggregate([
      { $match: query },
      {
        $facet: {
          metadata: [{ $count: "totalCount" }],
          data: [{ $skip: (currentPage - 1) * limit }, { $limit: limit }],
        },
      },
    ]);

    if (!result || !result[0].data.length) {
      return res
        .status(200)
        .json({ success: true, message: "No gifts found", gifts: [] });
    }

    const totalCount = result[0].metadata[0]?.totalCount || 0;
    const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;
    const gifts = result[0].data;

    return res.status(200).json({
      success: true,
      metaData: {
        totalCount,
        totalPages,
        currentPage,
        limit,
      },
      gifts,
    });
  } catch (error) {
    console.log("error in gift search router", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a single gift by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(404)
        .json({ success: true, message: "Invalid gift id" });
    }

    const gift = await Gift.findById(id);

    if (!gift) {
      return res
        .status(200)
        .json({ success: true, message: "Gift not found", gift: {} });
    }

    return res.status(200).json({ success: true, gift });
  } catch (error) {
    console.log("error in get gift by ID router", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export const giftRoutes = router;
