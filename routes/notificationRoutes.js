const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markNotificationAsRead,
  clearNotifications,
  markAllNotificationsAsRead,
} = require("../controller/notificationController");
const verifyToken = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", getNotifications);
router.patch("/:id/read", markNotificationAsRead);
router.delete("/", clearNotifications);
router.patch("/mark-all-read", markAllNotificationsAsRead);

module.exports = router;
