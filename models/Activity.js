const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "expense_added",
        "expense_updated",
        "expense_deleted",
        "settlement_made",
        "group_joined",
        "group_updated",
        "group_left",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
