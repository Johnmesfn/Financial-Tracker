// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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
    new winston.transports.File({ filename: "logs/user-model.log" }),
  ],
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    logger.info("🔐 Password hashed for user", { userId: this._id });
    next();
  } catch (error) {
    logger.error("❌ Password hashing failed", {
      userId: this._id,
      error: error.message,
    });
    next(error);
  }
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    logger.info("🔍 Password comparison result", {
      userId: this._id,
      isMatch,
    });
    return isMatch;
  } catch (error) {
    logger.error("❌ Password comparison failed", {
      userId: this._id,
      error: error.message,
    });
    return false;
  }
};

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  if (!process.env.JWT_SECRET) {
    logger.error("❌ JWT_SECRET is not defined");
    throw new Error("JWT_SECRET is not defined");
  }

  try {
    const token = jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });

    logger.info("🔐 JWT token generated", {
      userId: this._id,
      expiresIn: process.env.JWT_EXPIRE || "30d",
    });

    return token;
  } catch (error) {
    logger.error("❌ JWT token generation failed", {
      userId: this._id,
      error: error.message,
    });
    throw error;
  }
};

module.exports = mongoose.model("User", UserSchema);
