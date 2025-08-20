const Activity = require("../models/Activity");

const logActivity = async ({ group, user, type, message, meta = {} }) => {
  try {
    await Activity.create({ group, user, type, message, meta });
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
};

module.exports = logActivity;
