import mongoose from "mongoose";
import Gift from "../models/gift.model.js";

const allowedUpdateFields = [
  "name",
  "image",
  "description",
  "ageInYears",
  "condition",
  "category",
  "contactInfo",
  "address",
  "isTaken",
];

export const getAllGifts = async (req, res) => {
  let { currentPage, limit } = req.query;

  try {
    currentPage = parseInt(currentPage, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const matchStage =
      req.user && req.user.id
        ? [
            {
              $match: {
                postedBy: { $ne: new mongoose.Types.ObjectId(req.user.id) },
              },
            },
          ]
        : [];

    const result = await Gift.aggregate([
      ...matchStage,
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
};

export const searchGifts = async (req, res) => {
  let { name, category, condition, ageInYears, currentPage, limit } = req.query;
  try {
    currentPage = parseInt(currentPage, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    const query = {};
    if (name) query.name = { $regex: name, $options: "i" };
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (ageInYears) query.ageInYears = { $lte: parseInt(ageInYears, 10) };
    if (req.user && req.user.id) {
      query.postedBy = { $ne: new mongoose.Types.ObjectId(req.user.id) };
    }

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
};

export const getGiftById = async (req, res) => {
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
};

export const getMyGifts = async (req, res) => {
  try {
    const userId = req.user.id;
    const gifts = await Gift.find({ postedBy: userId }).sort({
      createdAt: -1,
    });
    return res.status(200).json({ success: true, gifts });
  } catch (error) {
    console.error("Error fetching my gifts:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createGift = async (req, res) => {
  try {
    const {
      name,
      image,
      description,
      ageInYears,
      condition,
      category,
      contactInfo,
      address,
    } = req.body;
    const postedBy = req.user.id;

    if (
      !name ||
      !image ||
      !description ||
      ageInYears == null ||
      !condition ||
      !category ||
      !contactInfo
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, image, description, ageInYears, condition, category, contactInfo",
      });
    }

    const gift = await Gift.create({
      name,
      image,
      description,
      ageInYears: parseInt(ageInYears, 10),
      condition,
      category,
      contactInfo,
      address: address ?? "",
      postedBy,
    });

    return res.status(201).json({ success: true, gift });
  } catch (error) {
    console.error("Error creating gift:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateGift = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid gift id" });
    }

    const gift = await Gift.findById(id);
    if (!gift) {
      return res
        .status(404)
        .json({ success: false, message: "Gift not found" });
    }

    if (gift.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own gifts",
      });
    }

    const updates = {};
    allowedUpdateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "ageInYears") {
          updates[field] = parseInt(req.body[field], 10);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    const updatedGift = await Gift.findByIdAndUpdate(id, updates, {
      new: true,
    });

    return res.status(200).json({ success: true, gift: updatedGift });
  } catch (error) {
    console.error("Error updating gift:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGift = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid gift id" });
    }

    const gift = await Gift.findById(id);
    if (!gift) {
      return res
        .status(404)
        .json({ success: false, message: "Gift not found" });
    }

    if (gift.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own gifts",
      });
    }

    await Gift.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Gift deleted" });
  } catch (error) {
    console.error("Error deleting gift:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
