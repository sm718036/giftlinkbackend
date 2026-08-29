import mongoose from "mongoose";
import { appConfig } from "../config/appConfig.js";

export const connectToDatabase = async () => {
  await mongoose.connect(appConfig.dbUrl);
  console.log("MongoDB connected");
  mongoose.connection.on("error", (err) =>
    console.error("MongoDB connection error:", err)
  );
  mongoose.connection.on("disconnected", () =>
    console.warn("MongoDB disconnected")
  );
};
