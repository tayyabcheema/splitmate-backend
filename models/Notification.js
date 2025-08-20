// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "expense_added",
        "settlement_made",
        "settlement_received",
        "member_joined",
        "member_left",
        "personal_expense_added",
        "group_updated",
        "invite_code_generated"
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
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
