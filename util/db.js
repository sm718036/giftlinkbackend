import mongoose from "mongoose";

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URL}`);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("Error connecting to MongoDB", error);
  }
};
