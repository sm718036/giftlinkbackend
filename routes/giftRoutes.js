/*jshint esversion: 8 */
import express from "express";
import Gift from "../models/gift.model.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const parsePagination = (reqQuery) => {
  const currentPage = Math.max(parseInt(reqQuery.currentPage, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(reqQuery.limit, 10) || 10, 1), 100);
  return { currentPage, limit };
};

const emptyResult = (res) =>
  res.status(200).json({ success: true, message: "No gifts found", gifts: [] });

const validateGiftInput = (body, { partial = false } = {}) => {
  const errors = [];

  const required = {
    name: "Name",
    description: "Description",
    category: "Category",
    condition: "Condition",
    contactInfo: "Contact info",
  };

  for (const [field, label] of Object.entries(required)) {
    if (partial && body[field] === undefined) continue;
    if (!isNonEmptyString(body[field])) errors.push(`${label} is required`);
  }

  if (!partial || body.ageInYears !== undefined) {
    const age = Number(body.ageInYears);
    if (!Number.isFinite(age) || age < 0 || age > 100) {
      errors.push("Age must be a number between 0 and 100");
    }
  }

  if (body.image !== undefined && body.image !== null && typeof body.image !== "string") {
    errors.push("Image must be provided as a data URL string");
  }

  if (body.isTaken !== undefined && typeof body.isTaken !== "boolean") {
    errors.push("isTaken must be true or false");
  }

  for (const field of ["address", "zipCode"]) {
    if (body[field] !== undefined && body[field] !== null && typeof body[field] !== "string") {
      errors.push(`${field} must be text`);
    }
  }

  return errors;
};

const pickGiftFields = (body) => {
  const fields = {};

  if (body.name !== undefined) fields.name = body.name.trim();
  if (body.image !== undefined) fields.image = body.image || null;
  if (body.description !== undefined) fields.description = body.description.trim();
  if (body.ageInYears !== undefined) fields.ageInYears = Number(body.ageInYears);
  if (body.condition !== undefined) fields.condition = body.condition.trim();
  if (body.category !== undefined) fields.category = body.category.trim();
  if (body.zipCode !== undefined) fields.zipCode = body.zipCode || null;
  if (body.address !== undefined) fields.address = body.address || null;
  if (body.contactInfo !== undefined) fields.contactInfo = body.contactInfo.trim();
  if (body.isTaken !== undefined) fields.isTaken = body.isTaken;

  return fields;
};

// Get all gifts
router.get("/", async (req, res, next) => {
  try {
    const { currentPage, limit } = parsePagination(req.query);

    const { totalCount, gifts } = await Gift.findPage({
      limit,
      offset: (currentPage - 1) * limit,
    });

    if (!gifts.length) return emptyResult(res);

    const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;

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
    next(error);
  }
});

// Search for gifts
router.get("/search", async (req, res, next) => {
  try {
    const { name, category, condition, ageInYears } = req.query;
    const { currentPage, limit } = parsePagination(req.query);

    let maxAge;
    if (ageInYears !== undefined && ageInYears !== "") {
      maxAge = parseInt(ageInYears, 10);
      if (!Number.isFinite(maxAge) || maxAge < 0) {
        return res.status(400).json({
          success: false,
          message: "Age filter must be a number of years (0 or more).",
        });
      }
    }

    const { totalCount, gifts } = await Gift.findPage({
      filters: {
        name: name?.trim(),
        category: category?.trim(),
        condition: condition?.trim(),
        ageInYears: maxAge,
      },
      limit,
      offset: (currentPage - 1) * limit,
    });

    if (!gifts.length) return emptyResult(res);

    const totalPages = totalCount ? Math.ceil(totalCount / limit) : 0;

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
    next(error);
  }
});

// Get the signed-in user's own gifts
router.get("/my-gifts", authMiddleware, async (req, res, next) => {
  try {
    const { gifts } = await Gift.findPage({
      filters: { postedBy: req.user.id },
      limit: 100,
      offset: 0,
    });

    return res.status(200).json({ success: true, gifts });
  } catch (error) {
    next(error);
  }
});

// Create a new gift
router.post("/post-gift", authMiddleware, async (req, res, next) => {
  try {
    const errors = validateGiftInput(req.body);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: `Please check the gift details: ${errors.join(", ")}.`,
      });
    }

    const gift = await Gift.create({
      ...pickGiftFields(req.body),
      postedBy: req.user.id,
    });

    return res
      .status(201)
      .json({ success: true, message: "Gift posted successfully", gift });
  } catch (error) {
    next(error);
  }
});

// Update a gift owned by the signed-in user
router.patch("/update/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!Gift.isValidId(id)) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid gift id" });
    }

    const existing = await Gift.findById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Gift not found" });
    }
    if (String(existing.postedBy) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only edit gifts that you posted.",
      });
    }

    const errors = validateGiftInput(req.body, { partial: true });
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: `Please check the gift details: ${errors.join(", ")}.`,
      });
    }

    const gift = await Gift.updateById(id, pickGiftFields(req.body));

    return res
      .status(200)
      .json({ success: true, message: "Gift updated successfully", gift });
  } catch (error) {
    next(error);
  }
});

// Delete a gift owned by the signed-in user
router.delete("/delete/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!Gift.isValidId(id)) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid gift id" });
    }

    const existing = await Gift.findById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Gift not found" });
    }
    if (String(existing.postedBy) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only delete gifts that you posted.",
      });
    }

    await Gift.deleteById(id);

    return res
      .status(200)
      .json({ success: true, message: "Gift deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Get a single gift by ID
router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!Gift.isValidId(id)) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid gift id" });
    }

    const gift = await Gift.findById(id);

    if (!gift) {
      return res
        .status(200)
        .json({ success: true, message: "Gift not found", gift: {} });
    }

    return res.status(200).json({ success: true, gift });
  } catch (error) {
    next(error);
  }
});

export const giftRoutes = router;
