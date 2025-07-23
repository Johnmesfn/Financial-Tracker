const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");

const app = express();
dotenv.config();

// Ensure necessary environment variables are set
if (!process.env.MONGO_URI || !process.env.PORT) {
  console.error("Missing environment variables");
  process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Optional: request logging

// Routes
const entryRoutes = require("./routes/entries");
app.use("/api/entries", entryRoutes);

// Connect DB and Start Server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // Exit process if connection fails
  });

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await mongoose.disconnect();
  process.exit(0);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});
