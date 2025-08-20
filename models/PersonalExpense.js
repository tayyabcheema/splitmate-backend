const mongoose = require("mongoose");

const personalExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    currency: {
      type: String,
      default: "PKR",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ["Credit Card", "Debit Card", "Cash", "PayPal", "Other"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PersonalExpense", personalExpenseSchema);
