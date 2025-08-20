const express = require("express");
const router = express.Router();
const {
  createExpense,
  getGroupExpenses,
  getAllGroupsWithBalance,
} = require("../controller/expenseController");
const verifyToken = require("../middleware/authMiddleware");

// router.post("/group/:id/add", verifyToken, createExpense);

// router.get("/group/:id/all-expenses", verifyToken, getGroupExpenses);

// POST: create new expense in group
router.post("/groups/:id/expenses", verifyToken, createExpense);

// GET: get all expenses in group
router.get("/groups/:id/expenses", verifyToken, getGroupExpenses);

router.get("/group/:id/all-expenses", verifyToken, getGroupExpenses);

router.get("/groups/all", verifyToken, getAllGroupsWithBalance);

module.exports = router;
