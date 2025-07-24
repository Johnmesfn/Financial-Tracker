// models/Entry.js
const mongoose = require("mongoose");

const VALID_CATEGORIES = [
  "Food", "Salary", "Utilities", "Entertainment", "Transport",
  "Healthcare", "Education", "Miscellaneous", "Housing", "Insurance",
  "Savings", "Debt Repayment", "Gifts/Donations", "Travel", "Pets",
  "Technology", "Subscriptions", "Personal Care", "Childcare", "Legal/Tax",
  "Repair/Maintenance", "Other",
];

const entrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "Amount must be a positive number"],
    },
    category: {
      type: String,
      enum: VALID_CATEGORIES,
      required: true,
    },
    note: {
      type: String,
      maxlength: [500, "Note cannot be more than 500 characters"],
      validate: {
        validator: function (val) {
          const banned = ["prohibited", "blocked"];
          return !banned.some((w) => val.toLowerCase().includes(w));
        },
        message: "Note contains prohibited content.",
      },
    },
    date: {
      type: Date,
      default: Date.now,
      validate: {
        validator: (value) => value.getTime() <= Date.now(),
        message: "Date cannot be in the future.",
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    audits: [
      {
        action: { type: String, enum: ["created", "updated", "deleted"], required: true },
        changes: { type: Map, of: mongoose.Schema.Types.Mixed },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Automatically log creation in audit
entrySchema.pre("save", function (next) {
  if (this.isNew) {
    this.audits.push({
      action: "created",
      changes: this.toObject(),
    });
  }
  next();
});

// Add compound index for efficient queries
entrySchema.index({ type: 1, category: 1, date: -1, isDeleted: 1 });

module.exports = mongoose.model("Entry", entrySchema);
module.exports.VALID_CATEGORIES = VALID_CATEGORIES;
