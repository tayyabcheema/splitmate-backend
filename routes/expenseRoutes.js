const express = require("express");
const router = express.Router();
const { createExpense, getGroupExpenses } = require("../controller/expenseController");
const verifyToken = require("../middleware/authMiddleware");

router.post("/group/:id/add", verifyToken, createExpense);

router.get("/group/:id/all-expenses", verifyToken, getGroupExpenses);

module.exports = router;
