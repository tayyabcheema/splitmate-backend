const Expense = require("../models/Expense");
const Group = require("../models/Group");
const createError = require("../utils/error");
const mongoose = require("mongoose");
const successResponse = require("../utils/response");
const logActivity = require("../utils/logActivity");
const notifyUser = require("../utils/notifyUser");

const createExpense = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const {
      amount,
      description,
      category,
      paidBy,
      participants,
      splitType,
      splits,
      notes,
      currency,
    } = req.body;

    // Basic validations
    if (!amount || !paidBy || !participants || participants.length === 0) {
      return next(
        createError(400, "Amount, paidBy, and participants are required")
      );
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(createError(400, "Invalid group ID"));
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return next(createError(404, "Group not found"));
    }

    const isMember = group.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return next(createError(403, "You are not a member of this group"));
    }

    // Split logic
    let splitAmounts = [];
    if (splitType === "equal") {
      const equalShare = parseFloat((amount / participants.length).toFixed(2));
      splitAmounts = participants.map((userId) => ({
        user: userId,
        amount: equalShare,
      }));
    } else if (splitType === "custom") {
      const totalSplit = splits.reduce((acc, s) => acc + Number(s.amount), 0);
      if (totalSplit !== amount) {
        return next(
          createError(400, "Custom splits do not add up to total amount")
        );
      }
      splitAmounts = splits;
    } else {
      return next(createError(400, "Invalid split type"));
    }

    const newExpense = new Expense({
      group: groupId,
      amount,
      description,
      category,
      paidBy,
      participants,
      splitType,
      splits: splitAmounts,
      notes,
      currency,
      createdBy: req.user._id,
    });

    const savedExpense = await newExpense.save();

    // Log activity
    await logActivity({
      group: groupId,
      user: req.user._id,
      type: "expense_added",
      message: `Added expense "${description}" of ${amount} ${currency}`,
      meta: { expenseId: savedExpense._id },
    });

    // Notify participants except the one who added the expense
    const recipients = participants.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    for (const recipientId of recipients) {
      await notifyUser(recipientId, {
        type: "expense_added",
        message: `An expense "${description}" of ${amount} ${currency} was added in your group.`,
        meta: { expenseId: savedExpense._id, groupId },
      });
    }
    

    return next(
      successResponse(201, "Expense created successfully", savedExpense)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const getGroupExpenses = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(createError(400, "Invalid group ID"));
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return next(createError(404, "Group not found"));
    }

    // Check if the user is a member
    const isMember = group.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return next(createError(403, "You are not a member of this group"));
    }

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("participants", "name email")
      .sort({ createdAt: -1 });

    return next(
      successResponse(200, "Expenses retrieved successfully", expenses)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

module.exports = { createExpense, getGroupExpenses };
