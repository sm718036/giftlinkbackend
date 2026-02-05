import express from "express";
import cors from "cors";
import { connectToDatabase } from "./util/db.js";
import { giftRoutes } from "./routes/giftRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { wishlistRoutes } from "./routes/wishlistRoutes.js";
import { appConfig } from "./config/appConfig.js";

const app = express();
app.use(
  cors({
    origin: appConfig.dashboardUrl,
  })
);

// Allow larger payloads for gift images (base64)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1smb" }));

const port = appConfig.port || 3060;

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Connected to the server" });
});

// Use Routes
app.use("/api/gifts", giftRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);

// start server
const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
