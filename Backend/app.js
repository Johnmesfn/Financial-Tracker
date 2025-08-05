// app.js
const express = require("express");
const app = express();
const mongoose = require("mongoose");
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
    new winston.transports.File({ filename: "logs/app.log" }),
  ],
});

// Body parser
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-auth-token"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

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
