import express from "express";
import cors from "cors";
import { connectToDatabase, closeDatabase } from "./util/db.js";
import { giftRoutes } from "./routes/giftRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { wishlistRoutes } from "./routes/wishlistRoutes.js";
import { appConfig } from "./config/appConfig.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

const app = express();
const port = Number(appConfig.port) || 3060;

app.use(
  cors({
    origin: appConfig.dashboardUrl || true,
  })
);
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true, limit: "6mb" }));

// Test Route
app.get("/", (req, res) => {
  res.json({ message: "Connected to the server" });
});

// Use Routes
app.use("/api/gifts", giftRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const requiredEnv = [
  ["DATABASE_URL", appConfig.dbUrl],
  ["JWT_SECRET", appConfig.JWTSecret],
];

// start server
const startServer = async () => {
  const missing = requiredEnv
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    console.error(
      `Cannot start GiftLink: missing required environment variable(s): ${missing.join(
        ", "
      )}.`
    );
    console.error(
      "Add them to giftlinkbackend/.env (see .env.sample) and start the server again."
    );
    process.exit(1);
  }

  try {
    await connectToDatabase();
  } catch (error) {
    console.error(`Cannot start GiftLink: ${error.message}`);
    console.error(
      "Check that PostgreSQL is running, that the database exists, and that DATABASE_URL is correct."
    );
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Cannot start GiftLink: port ${port} is already in use. Stop the other process or set a different PORT in .env.`
      );
    } else {
      console.error(`Cannot start GiftLink: ${error.message}`);
    }
    process.exit(1);
  });

  const shutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down GiftLink...`);
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();
