// controllers/auth.js
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const winston = require("winston");

// Create logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/auth-controllers.log" }),
  ],
});

// @desc      Register user
// @route     POST /api/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  logger.info("📝 Registration attempt", { email });

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  logger.info("✅ User registered successfully", {
    userId: user._id,
    email: user.email,
  });

  sendTokenResponse(user, 201, res);
});

// @desc      Login user
// @route     POST /api/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  logger.info("🔑 Login attempt", { email });

  // Validate email & password
  if (!email || !password) {
    logger.warn("❌ Invalid login attempt - missing credentials", { email });
    const error = new Error("Please provide an email and password");
    error.statusCode = 400;
    throw error;
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    logger.warn("❌ Invalid login attempt - user not found", { email });
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    logger.warn("❌ Invalid login attempt - wrong password", { email });
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  logger.info("✅ Login successful", { userId: user._id, email: user.email });
  sendTokenResponse(user, 200, res);
});

// @desc      Get current logged in user
// @route     GET /api/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res) => {
  logger.info("👤 Fetching current user", { userId: req.user.id });

  const user = await User.findById(req.user.id);

  if (!user) {
    logger.error("❌ User not found for ID", { userId: req.user.id });
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  logger.info("✅ User data retrieved", { userId: user._id });

  res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  logger.info("🔐 Token generated", {
    userId: user._id,
    expiresIn: process.env.JWT_EXPIRE,
  });

  res.status(statusCode).json({
    success: true,
    token,
    expiresIn: process.env.JWT_EXPIRE,
  });
};
