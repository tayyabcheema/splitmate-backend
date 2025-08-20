const express = require("express");
const router = express.Router();
const {
  createGroup,
  updateGroup,
  deleteGroupById,
  getGroupBalances,
  getGroupDetiailById,
  generateGroupInvite,
  joinGroupByInvite,
  getGroupExpenses,
  getUserTotalBalance,
  exportGroupExpensesCSV,
  leaveGroup,
  getAllGroups,
  checkUserByEmail,
} = require("../controller/groupController");
const verifyToken = require("../middleware/authMiddleware");

// Middleware to check authentication
router.use(verifyToken);

router.post("/create", createGroup);

router.get("/all", getAllGroups);

router.get("/check", checkUserByEmail);

router.get("/:id", getGroupDetiailById);

router.put("/update/:id", updateGroup);

router.get("/:id/balances", getGroupBalances);

router.get("/my-balance", getUserTotalBalance);

router.post("/:id/invite", generateGroupInvite);

router.post("/join", joinGroupByInvite);

// router.get("/:id/expenses", getGroupExpenses);

router.get("/:id/export/csv", exportGroupExpensesCSV);

router.post("/:id/leave", leaveGroup);

router.delete("/:id", deleteGroupById);

module.exports = router;
