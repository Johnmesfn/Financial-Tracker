const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ["income", "expense"],
    required: true
  },
  amount: { 
    type: Number, 
    required: true, 
    min: [0, 'Amount cannot be negative'],
    validate: {
      validator: function(value) {
        if (this.type === 'expense' && value > 0) return false;
        if (this.type === 'income' && value < 0) return false;
        return true;
      },
      message: 'Invalid amount for the given entry type.'
    }
  },
  category: { 
    type: String, 
    enum: [
      "Food", 
      "Salary", 
      "Utilities", 
      "Entertainment", 
      "Transport", 
      "Healthcare", 
      "Education", 
      "Miscellaneous", 
      "Housing", 
      "Insurance", 
      "Savings", 
      "Debt Repayment", 
      "Gifts/Donations", 
      "Travel", 
      "Pets", 
      "Technology", 
      "Subscriptions", 
      "Personal Care", 
      "Childcare", 
      "Legal/Tax", 
      "Repair/Maintenance"
    ], 
    required: true
  },
  note: { 
    type: String, 
    maxlength: [500, 'Note cannot be more than 500 characters'],
    validate: {
      validator: function(value) {
        const prohibitedWords = ["prohibited", "blocked"];
        return !prohibitedWords.some(word => value.includes(word));
      },
      message: "Note contains prohibited words."
    }
  },
  date: { 
    type: Date, 
    default: Date.now,
    validate: {
      validator: function(value) {
        return value <= Date.now();
      },
      message: 'Date cannot be in the future'
    }
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  audits: [{ // Add a field to store audit logs
    action: { type: String, enum: ['created', 'updated', 'deleted'], required: true },
    changes: { type: Map, of: mongoose.Schema.Types.Mixed }, // Store changes as key-value pairs
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Pre-save hook for auditing creation and updates
entrySchema.pre('save', async function(next) {
  const entry = this;

  // Skip audit logs if the entry is being deleted
  if (entry.isDeleted) return next();

  if (entry.isNew) {
    // Log the creation of the entry
    entry.audits.push({
      action: 'created',
      changes: {
        amount: entry.amount,
        category: entry.category,
        note: entry.note
      }
    });
  } else {
    // Log updates if the entry is not deleted
    const changes = {};
    const previousData = await mongoose.model("Entry").findById(entry._id);

    if (previousData.amount !== entry.amount) changes.amount = { from: previousData.amount, to: entry.amount };
    if (previousData.category !== entry.category) changes.category = { from: previousData.category, to: entry.category };
    if (previousData.note !== entry.note) changes.note = { from: previousData.note, to: entry.note };

    if (Object.keys(changes).length > 0) {
      entry.audits.push({
        action: 'updated',
        changes: changes
      });
    }
  }

  next();
});

// Indexes for optimized queries
entrySchema.index({ type: 1 });
entrySchema.index({ category: 1 });
entrySchema.index({ date: -1 });

// Add a text index for the 'note' field for full-text search
entrySchema.index({ note: 'text' });

// Query middleware to exclude deleted entries by default
entrySchema.pre('find', function() {
  this.where({ isDeleted: false });
});

entrySchema.pre('findOne', function() {
  this.where({ isDeleted: false });
});

module.exports = mongoose.model("Entry", entrySchema);
