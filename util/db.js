import mongoose from "mongoose";

export const connectToDatabase = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URL}`);
    console.log("MongoDB connected");
    mongoose.connection.on("error", (err) =>
      console.error("MongoDB connection error:", err)
    );
    mongoose.connection.on("disconnected", () =>
      console.warn("MongoDB disconnected")
    );
  } catch (error) {
    console.log("Error connecting to MongoDB", error);
    return error;
  }
};
