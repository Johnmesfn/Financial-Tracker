// server.js

const fs = require("fs");
const mongoose = require("mongoose");
const app = require("./app");
const winston = require("winston");

// Load environment variables
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Ensure logs directory exists
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Winston logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Load environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate required environment variables
if (!MONGO_URI) {
  logger.error("Missing MONGO_URI environment variable");
  process.exit(1);
}

if (!JWT_SECRET) {
  logger.error("Missing JWT_SECRET environment variable");
  logger.error("Please add JWT_SECRET to your .env file");
  process.exit(1);
}

// Retry configuration
const MAX_RETRIES = 5;
let retryCount = 0;

// Main server start function
const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info("✅ MongoDB connected successfully");

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT}`);
    });

    const gracefulShutdown = () => {
      logger.info("🛑 Shutdown signal received. Closing server...");

      server.close(() => {
        logger.info("HTTP server closed");
        mongoose.connection.close(false, () => {
          logger.info("MongoDB connection closed");
          process.exit(0);
        });
      });
    };

    process.on("SIGINT", gracefulShutdown);
    process.on("SIGTERM", gracefulShutdown);
  } catch (error) {
    logger.error("MongoDB connection failed", {
      message: error.message,
      stack: error.stack,
    });

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      logger.warn(`Retrying MongoDB connection in 5s... (Attempt ${retryCount}/${MAX_RETRIES})`);
      setTimeout(startServer, 5000);
    } else {
      logger.error("❌ Max retries reached. Exiting application.");
      process.exit(1);
    }
  }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { message: error.message, stack: error.stack });
  setTimeout(() => process.exit(1), 1000);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Start the server
startServer();
