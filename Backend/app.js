// app.js
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const winston = require("winston");
const cors = require("cors");

// Create logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

// Body parser
app.use(express.json());

// Configure CORS Option
const corsOptions = {
  origin: 'https://financial-tracker-frontend-nvwp.onrender.com', // Your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  credentials: true, // Allow credentials
  optionsSuccessStatus: 200 // For legacy browser support
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicit preflight handling for OPTIONS method
app.options("*", cors(corsOptions));

// Database connection test endpoint
app.get("/api/db-test", async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];

    logger.info("Database test endpoint accessed", {
      connectionState: states[state],
      hasCollections: await mongoose.connection.db.listCollections().hasNext(),
    });

    res.json({
      success: true,
      dbState: states[state],
      hasCollections: await mongoose.connection.db.listCollections().hasNext(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Database test failed", {
      message: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

app.use((req, res, next) => {
  // Skip authentication for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  // For other requests, check for token 
  const token = req.header("x-auth-token");
  if (!token && req.path.startsWith("/api/entries")){
    return res.status(401).json({
      success: false,
      message: "No authentication token provided",
      debug: {
        requiredHeader: "x-auth-token",
      },
    });
  }
  next();
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/entries", require("./routes/entries"));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Server error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
    debug:
      process.env.NODE_ENV === "development"
        ? {
            stack: err.stack,
            path: req.path,
          }
        : "🥞",
  });
});

module.exports = app;
