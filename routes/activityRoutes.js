const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getGroupActivities } = require("../controller/activityController");

router.get("/group/:id", verifyToken, getGroupActivities);

module.exports = router;
