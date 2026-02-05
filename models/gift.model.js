import mongoose from "mongoose";

const giftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    ageInYears: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contactInfo: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    isTaken: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Gift", giftSchema);
