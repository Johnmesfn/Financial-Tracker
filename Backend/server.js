// server.js
const mongoose = require("mongoose");
const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Ensure necessary env vars
if (!MONGO_URI) {
  console.error("Missing MONGO_URI environment variable");
  process.exit(1);
}

// MongoDB connect with retry
const connectWithRetry = () => {
  mongoose
    .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
      console.log("MongoDB connected");
      app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
      setTimeout(connectWithRetry, 5000); // Retry every 5 seconds
    });
};

connectWithRetry();

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down...");
  await mongoose.disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
