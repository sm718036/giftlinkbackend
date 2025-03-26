/*jshint esversion: 8 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectToDatabase = require("./util/db");
const port = process.env.PORT || 3060;

const app = express();
app.use("*", cors());

app.use(express.json());

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});

app.get("/", (req, res) => {
  res.send("Inside the server");
});

// Route files
const giftRoutes = require("./routes/giftRoutes");
const authRoutes = require("./routes/authRoutes");
const searchRoutes = require("./routes/searchRoutes");

// Use Routes
app.use("/api/gifts", giftRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/search", searchRoutes);

app.listen(port, async () => {
  // Connect to MongoDB; we just do this one time
  await connectToDatabase()
  console.log(`Server running on port ${port}`);
});
