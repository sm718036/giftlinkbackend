import express from "express";
import cors from "cors";
import { connectToDatabase } from "./util/db.js";
import { giftRoutes } from "./routes/giftRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { appConfig } from "./config/appConfig.js";

const app = express();
app.use(
  cors({
    origin: appConfig.dashboardUrl,
  })
);
app.use(express.json());
express.urlencoded({ extended: true });

const port = appConfig.port || 3060;

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Connected to the server" });
});

// Use Routes
app.use("/api/gifts", giftRoutes);
app.use("/api/auth", authRoutes);

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
