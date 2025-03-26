import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectToDatabase } from "./util/db.js";
import { giftRoutes } from "./routes/giftRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { searchRoutes } from "./routes/searchRoutes.js";

const app = express();
dotenv.config();
app.use("*", cors());
app.use(express.json());
const port = process.env.PORT || 3060;

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Connected to the server" });
});

// Use Routes
app.use("/api/gifts", giftRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);

// Start Server
app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Server running on port ${port}`);
});
