// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const winston = require("winston");

// Create logger specifically for auth
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/auth.log" }),
  ],
});

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in x-auth-token header
  token = req.headers["x-auth-token"];

  logger.info("🔍 Authentication attempt", {
    path: req.path,
    method: req.method,
    hasToken: !!token,
  });

  // Make sure token exists
  if (!token) {
    logger.warn("❌ No token provided", { path: req.path });
    return res.status(401).json({
      success: false,
      message: "No authentication token provided",
      debug: {
        requiredHeader: "x-auth-token",
      },
    });
  }

  try {
    // Verify token
    logger.info("✅ Token received, verifying...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    logger.info("🔐 Token verified", { userId: decoded.id });

    // Find user by ID and attach to request
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      logger.error("❌ User not found in database", { userId: decoded.id });
      return res.status(401).json({
        success: false,
        message: "User account not found",
        debug: {
          tokenId: decoded.id,
          token: token.substring(0, 10) + "...",
        },
      });
    }

    logger.info("👤 User authenticated", {
      userId: req.user._id,
      email: req.user.email,
    });

    next();
  } catch (err) {
    logger.error("❌ Token verification failed", {
      message: err.message,
      errorType: err.name,
      stack: err.stack,
    });

    let errorMessage = "Invalid authentication token";
    if (err.name === "TokenExpiredError")
      errorMessage = "Authentication token has expired";
    if (err.name === "JsonWebTokenError") errorMessage = "Invalid token format";

    return res.status(401).json({
      success: false,
      message: errorMessage,
      errorType: err.name,
      debug: {
        token: token ? token.substring(0, 10) + "..." : "no token",
      },
    });
  }
};
