const Notification = require("../models/Notification");

const notifyUser = async (userId, { type, message, meta = {} }) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      message,
      meta,
    });

    await notification.save();
  } catch (err) {
    console.error("Notification error:", err.message);
  }
};

module.exports = notifyUser;
