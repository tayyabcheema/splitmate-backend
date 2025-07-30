const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const {
  createSettlement,
  getGroupSettlements,
} = require("../controller/settlementController");

router.post("/settle", verifyToken, createSettlement);

router.get("/group/:id", verifyToken, getGroupSettlements);

module.exports = router;
