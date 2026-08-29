import express from "express";
import cors from "cors";
import { connectToDatabase } from "./util/db.js";
import { giftRoutes } from "./routes/giftRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { wishlistRoutes } from "./routes/wishlistRoutes.js";
import { appConfig } from "./config/appConfig.js";
import { seedSampleGifts } from "./util/seedSampleGifts.js";

export const app = express();
app.use(
  cors({
    origin: appConfig.dashboardUrl,
  }),
);

// Allow larger payloads for gift images (base64)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

const port = appConfig.port || 3060;

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Connected to the server" });
});

// Use Routes
app.use("/api/gifts", giftRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("Unhandled request error:", error);
  if (res.headersSent) return next(error);
  return res.status(error.status || 500).json({
    success: false,
    message:
      error.status === 413
        ? "Request payload is too large"
        : "Internal Server Error",
  });
});

// start server
export const startServer = async () => {
  try {
    await connectToDatabase();
    await seedSampleGifts();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}
