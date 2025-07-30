const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
    },
    settledAt: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ["cash", "bank", "other"],
      default: "other",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settlement", settlementSchema);
