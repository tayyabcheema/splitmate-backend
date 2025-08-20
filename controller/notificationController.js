const Notification = require("../models/Notification");
const createError = require("../utils/error");
const successResponse = require("../utils/response");

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 }) // newest first
      .limit(50); // optional: limit for performance

    return next(
      successResponse(200, "Notifications fetched successfully", notifications)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!notification) {
      return next(createError(404, "Notification not found"));
    }

    notification.read = true;
    await notification.save();

    return next(
      successResponse(200, "Notification marked as read", notification)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const clearNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });

    return next(successResponse(200, "All notifications cleared"));
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { $set: { read: true } }
    );

    return next(successResponse(200, "All notifications marked as read"));
  } catch (err) {
    return next(createError(500, err.message));
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  clearNotifications,
  markAllNotificationsAsRead,
};
