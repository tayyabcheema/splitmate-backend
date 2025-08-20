const express = require("express");
const router = express.Router();
const {
  addPersonalExpense,
  getPersonalExpenses,
  updatePersonalExpense,
  deletePersonalExpense,
  exportPersonalExpensesCSV
} = require("../controller/personalExpenseController");
const verifyToken = require("../middleware/authMiddleware");


router.use(verifyToken);

router.post("/add", addPersonalExpense);
router.get("/", getPersonalExpenses);
router.put("/:id", updatePersonalExpense);
router.delete("/:id", deletePersonalExpense);
router.get("/export/csv", exportPersonalExpensesCSV);

module.exports = router;
