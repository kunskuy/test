import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
};

router.post("/register", async (req, res) => {
  try {
    console.log("Register attempt:", req.body); //testapi

    const { email, username, password } = req.body;
    console.log("Extracted data:", { email, username, password: "***" }); //testdb

    if (!username || !email || !password) {
      console.log("Validation failed: missing fields"); //testapi
      return res.status(400).json({ message: " All fields are required" });
    }

    if (password.length < 6) {
      console.log("Validation failed: password too short");
      return res
        .status(400)
        .json({ message: "Password should be at least 6 characters long" });
    }

    if (username.length < 3) {
      console.log("Validation failed: username too short"); //testapi
      return res
        .status(400)
        .json({ message: "Username should be at least 3 characters long" });
    }

    // check if user already exist
    console.log("Checking if email exists:", email); //testapi
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log("Email already exists"); //testapi
      return res.status(400).json({ message: "Email already exist" });
    }

    console.log("Checking if username exists:", username); //testdb
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log("Username already exists"); //testdb
      return res.status(400).json({ message: "Username already exist" });
    }

    // get random avatar
    console.log("Generating avatar for user"); //testapi
    const profileImage = `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}`;

    console.log("Creating new user object"); //testapi
    const user = new User({
      email,
      username,
      password,
      profileImage,
    });

    console.log("Saving user to database..."); //testapi
    await user.save();
    console.log("User saved successfully with ID:", user._id); //testapi

    const token = generateToken(user._id);

    console.log("Sending successful response"); //testapi
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.log("Error register route, error");
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      errorType: error.name,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required " });

    //check if user exsist
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credential" });

    //check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.log("Error in login route", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
