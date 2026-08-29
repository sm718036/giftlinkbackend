import mongoose from "mongoose";
import Gift from "../models/gift.model.js";
import Wishlist from "../models/wishlist.model.js";

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

const getPagination = (currentPage, limit) => ({
  currentPage: Math.max(parseInt(currentPage, 10) || 1, 1),
  limit: Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100),
});

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getAllGifts = async (req, res) => {
  let { currentPage, limit } = req.query;
  const userId = req?.user?.id;
  try {
    ({ currentPage, limit } = getPagination(currentPage, limit));

    const matchStage = [
      { $match: { isTaken: false } },
      ...(req.user && userId
        ? [
            {
              $match: {
                postedBy: { $ne: new mongoose.Types.ObjectId(String(userId)) },
              },
            },
          ]
        : []),
    ];

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
      return res.status(200).json({
        success: true,
        message: "No gifts found",
        metaData: { totalCount: 0, totalPages: 0, currentPage, limit },
        gifts: [],
      });
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
  const userId = req.user?.id;
  try {
    ({ currentPage, limit } = getPagination(currentPage, limit));

    const query = { isTaken: false };
    if (name)
      query.name = { $regex: escapeRegExp(String(name)), $options: "i" };
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (ageInYears) {
      const parsedAge = parseInt(ageInYears, 10);
      if (!Number.isNaN(parsedAge) && parsedAge >= 0)
        query.ageInYears = { $lte: parsedAge };
    }
    if (req.user && userId) {
      query.postedBy = { $ne: new mongoose.Types.ObjectId(String(userId)) };
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
      return res.status(200).json({
        success: true,
        message: "No gifts found",
        metaData: { totalCount: 0, totalPages: 0, currentPage, limit },
        gifts: [],
      });
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
        .status(400)
        .json({ success: false, message: "Invalid gift id" });
    }

    const gift = await Gift.findById(id);

    if (!gift) {
      return res
        .status(404)
        .json({ success: false, message: "Gift not found" });
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

export const postNewGift = async (req, res) => {
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

    const parsedAge = Number(ageInYears);

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

    if (!Number.isInteger(parsedAge) || parsedAge < 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "ageInYears must be a non-negative integer",
        });
    }

    const gift = await Gift.create({
      name,
      image,
      description,
      ageInYears: parsedAge,
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

    if (gift.isSample) {
      return res.status(403).json({
        success: false,
        message: "Sample gifts cannot be changed or claimed",
      });
    }

    if (gift.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own gifts",
      });
    }

    if (req.body.ageInYears !== undefined) {
      const parsedAge = Number(req.body.ageInYears);
      if (!Number.isInteger(parsedAge) || parsedAge < 0) {
        return res.status(400).json({
          success: false,
          message: "ageInYears must be a non-negative integer",
        });
      }
    }

    const updates = {};
    allowedUpdateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "ageInYears") {
          updates[field] = Number(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    const updatedGift = await Gift.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
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

    if (gift.isSample) {
      return res.status(403).json({
        success: false,
        message: "Sample gifts cannot be deleted",
      });
    }

    if (gift.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own gifts",
      });
    }

    await Promise.all([
      Gift.findByIdAndDelete(id),
      Wishlist.deleteMany({ gift: id }),
    ]);
    return res.status(200).json({ success: true, message: "Gift deleted" });
  } catch (error) {
    console.error("Error deleting gift:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
