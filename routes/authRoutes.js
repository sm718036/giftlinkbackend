import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  try {
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);
    const email = req.body.email;
    const newUser = await User.insertOne({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: hash,
    });

    const payload = {
      user: {
        id: newUser._id.toString(),
      },
    };

    const authtoken = jwt.sign(payload, JWT_SECRET);
    return res.json({
      message: "User registered successfully",
      authtoken,
      email,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const theUser = await User.findOne({ email: req.body.email });

    if (theUser) {
      let result = await bcryptjs.compare(req.body.password, theUser.password);
      if (!result) {
        return res.status(400).json({ message: "Wrong pasword" });
      }
      let payload = {
        user: {
          id: theUser._id.toString(),
        },
      };

      const userName = theUser.firstName;
      const userEmail = theUser.email;

      const authtoken = jwt.sign(payload, JWT_SECRET);
      return res
        .status(200)
        .json({
          message: "User logged in successfully",
          authtoken,
          userName,
          userEmail,
        });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (e) {
    console.error("Error in login", e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// update API
router.put("/update", async (req, res) => {
  const email = req.headers.email;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    existingUser.firstName = req.body.name;
    existingUser.updatedAt = new Date();

    //Update user credentials in DB
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: existingUser },
      { returnDocument: "after" }
    );

    //Create JWT authentication with user._id as payload using secret key from .env file
    const payload = {
      user: {
        id: updatedUser._id.toString(),
      },
    };

    const authtoken = jwt.sign(payload, JWT_SECRET);

    res.status(201).json({ message: "User updated successfully", authtoken });
  } catch (error) {
    console.error("Error in updating user", error);
    return res.status(500).json({message: "Internal Server Error"});
  }
});

export const authRoutes = router;
