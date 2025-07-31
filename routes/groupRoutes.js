const express = require("express");
const router = express.Router();
const {
  createGroup,
  updateGroup,
  getGroupBalances,
  generateGroupInvite,
  joinGroupByInvite,
  getGroupExpenses,
  exportGroupExpensesCSV,
  leaveGroup,
  getAllGroups
} = require("../controller/groupController");
const verifyToken = require("../middleware/authMiddleware");

// Middleware to check authentication
router.use(verifyToken);

router.post("/create", createGroup);

router.get("/all", getAllGroups);

router.put("/update/:id", updateGroup);

router.get("/:id/balances", getGroupBalances);

router.post("/:id/invite", generateGroupInvite);

router.post("/join", joinGroupByInvite);

router.get("/:id/expenses", getGroupExpenses);

router.get("/:id/export/csv", exportGroupExpensesCSV);

router.post("/:id/leave", leaveGroup);


module.exports = router;
