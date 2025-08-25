// // const Expense = require("../models/Expense");
// // const Group = require("../models/Group");
// // const createError = require("../utils/error");
// // const mongoose = require("mongoose");
// // const successResponse = require("../utils/response");
// // const logActivity = require("../utils/logActivity");
// // const notifyUser = require("../utils/notifyUser");

// // const createExpense = async (req, res, next) => {
// //   try {
// //     const groupId = req.params.id;
// //     const {
// //       amount,
// //       description,
// //       category,
// //       paidBy,
// //       participants,
// //       splitType,
// //       splits,
// //       notes,
// //       currency,
// //     } = req.body;

// //     // Basic validations
// //     if (!amount || !paidBy || !participants || participants.length === 0) {
// //       return next(
// //         createError(400, "Amount, paidBy, and participants are required")
// //       );
// //     }

// //     if (!mongoose.Types.ObjectId.isValid(groupId)) {
// //       return next(createError(400, "Invalid group ID"));
// //     }

// //     const group = await Group.findById(groupId);
// //     if (!group) {
// //       return next(createError(404, "Group not found"));
// //     }

// //     const isMember = group.members.some(
// //       (member) => member.user.toString() === req.user._id.toString()
// //     );
// //     if (!isMember) {
// //       return next(createError(403, "You are not a member of this group"));
// //     }

// //     // Split logic
// //     let splitAmounts = [];
// //     if (splitType === "equal") {
// //       const equalShare = parseFloat((amount / participants.length).toFixed(2));
// //       splitAmounts = participants.map((userId) => ({
// //         user: userId,
// //         amount: equalShare,
// //       }));
// //     } else if (splitType === "custom") {
// //       const totalSplit = splits.reduce((acc, s) => acc + Number(s.amount), 0);
// //       if (totalSplit !== amount) {
// //         return next(
// //           createError(400, "Custom splits do not add up to total amount")
// //         );
// //       }
// //       splitAmounts = splits;
// //     } else {
// //       return next(createError(400, "Invalid split type"));
// //     }

// //     const newExpense = new Expense({
// //       group: groupId,
// //       amount,
// //       description,
// //       category,
// //       paidBy,
// //       participants,
// //       splitType,
// //       splits: splitAmounts,
// //       notes,
// //       currency,
// //       createdBy: req.user._id,
// //     });

// //     const savedExpense = await newExpense.save();

// //     // Log activity
// //     await logActivity({
// //       group: groupId,
// //       user: req.user._id,
// //       type: "expense_added",
// //       message: `Added expense "${description}" of ${amount} ${currency}`,
// //       meta: { expenseId: savedExpense._id },
// //     });

// //     // Notify participants except the one who added the expense
// //     const recipients = participants.filter(
// //       (id) => id.toString() !== req.user._id.toString()
// //     );
// //     for (const recipientId of recipients) {
// //       await notifyUser(recipientId, {
// //         type: "expense_added",
// //         message: `An expense "${description}" of ${amount} ${currency} was added in your group.`,
// //         meta: { expenseId: savedExpense._id, groupId },
// //       });
// //     }

// //     return next(
// //       successResponse(201, "Expense created successfully", savedExpense)
// //     );
// //   } catch (err) {
// //     return next(createError(500, err.message));
// //   }
// // };

// // const getGroupExpenses = async (req, res, next) => {
// //   try {
// //     const groupId = req.params.id;

// //     if (!mongoose.Types.ObjectId.isValid(groupId)) {
// //       return next(createError(400, "Invalid group ID"));
// //     }

// //     const group = await Group.findById(groupId);
// //     if (!group) {
// //       return next(createError(404, "Group not found"));
// //     }

// //     // Check if the user is a member
// //     const isMember = group.members.some(
// //       (member) => member.user.toString() === req.user._id.toString()
// //     );
// //     if (!isMember) {
// //       return next(createError(403, "You are not a member of this group"));
// //     }

// //     const expenses = await Expense.find({ group: groupId })
// //       .populate("paidBy", "name email")
// //       .populate("participants", "name email")
// //       .sort({ createdAt: -1 });

// //     return next(
// //       successResponse(200, "Expenses retrieved successfully", expenses)
// //     );
// //   } catch (err) {
// //     return next(createError(500, err.message));
// //   }
// // };

// // module.exports = { createExpense, getGroupExpenses };

// const Expense = require("../models/Expense");
// const Group = require("../models/Group");
// const createError = require("../utils/error");
// const mongoose = require("mongoose");
// const successResponse = require("../utils/response");
// const logActivity = require("../utils/logActivity");
// const notifyUser = require("../utils/notifyUser");

// const createExpense = async (req, res, next) => {
//   try {
//     const groupId = req.params.id;
//     const {
//       amount,
//       description,
//       category,
//       paidBy,
//       participants,
//       splitType,
//       splits,
//       notes,
//       currency,
//     } = req.body;

//     console.log("Incoming expense data:", req.body);

//     // Basic validations
//     if (
//       !amount ||
//       isNaN(amount) ||
//       !paidBy ||
//       !participants ||
//       participants.length === 0
//     ) {
//       return next(
//         createError(
//           400,
//           "Amount, paidBy, and participants are required and must be valid"
//         )
//       );
//     }

//     if (!mongoose.Types.ObjectId.isValid(groupId)) {
//       return next(createError(400, "Invalid group ID"));
//     }

//     const group = await Group.findById(groupId);
//     if (!group) {
//       return next(createError(404, "Group not found"));
//     }

//     const isMember = group.members.some(
//       (member) => member.user.toString() === req.user._id.toString()
//     );
//     if (!isMember) {
//       return next(createError(403, "You are not a member of this group"));
//     }

//     // Split logic
//     let splitAmounts = [];
//     if (splitType === "equal") {
//       const equalShare = parseFloat((amount / participants.length).toFixed(2));
//       let totalAssigned = equalShare * participants.length;
//       let diff = parseFloat((amount - totalAssigned).toFixed(2));

//       splitAmounts = participants.map((userId, idx) => {
//         let share = equalShare;
//         // ✅ Add leftover cents to last participant
//         if (idx === participants.length - 1) {
//           share = parseFloat((equalShare + diff).toFixed(2));
//         }
//         return { user: userId, amount: share };
//       });
//     } else if (splitType === "custom") {
//       const totalSplit = splits.reduce((acc, s) => acc + Number(s.amount), 0);
//       if (parseFloat(totalSplit.toFixed(2)) !== parseFloat(amount.toFixed(2))) {
//         return next(
//           createError(400, "Custom splits do not add up to total amount")
//         );
//       }
//       splitAmounts = splits.map((s) => ({
//         user: s.user,
//         amount: parseFloat(s.amount),
//       }));
//     } else {
//       return next(createError(400, "Invalid split type"));
//     }

//     const newExpense = new Expense({
//       group: groupId,
//       amount,
//       description,
//       category,
//       paidBy,
//       participants,
//       splitType,
//       splits: splitAmounts,
//       notes,
//       currency,
//       createdBy: req.user._id,
//     });

//     const savedExpense = await newExpense.save();

//     // Log activity
//     await logActivity({
//       group: groupId,
//       user: req.user._id,
//       type: "expense_added",
//       message: `Added expense "${description}" of ${amount} ${currency}`,
//       meta: { expenseId: savedExpense._id },
//     });

//     // Notify participants except the one who added the expense
//     const recipients = participants.filter(
//       (id) => id.toString() !== req.user._id.toString()
//     );
//     for (const recipientId of recipients) {
//       await notifyUser(recipientId, {
//         type: "expense_added",
//         message: `An expense "${description}" of ${amount} ${currency} was added in your group.`,
//         meta: { expenseId: savedExpense._id, groupId },
//       });
//     }

//     // ✅ FIX: send response directly
//     return res
//       .status(201)
//       .json(successResponse(201, "Expense created successfully", savedExpense));
//   } catch (err) {
//     return next(createError(500, err.message));
//   }
// };

// const getGroupExpenses = async (req, res, next) => {
//   try {
//     const groupId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(groupId)) {
//       return next(createError(400, "Invalid group ID"));
//     }

//     const group = await Group.findById(groupId);
//     if (!group) {
//       return next(createError(404, "Group not found"));
//     }

//     // Check if the user is a member
//     const isMember = group.members.some(
//       (member) => member.user.toString() === req.user._id.toString()
//     );
//     if (!isMember) {
//       return next(createError(403, "You are not a member of this group"));
//     }

//     const expenses = await Expense.find({ group: groupId })
//       .populate("paidBy", "name email")
//       .populate("participants", "name email")
//       .sort({ createdAt: -1 });

//     // ✅ FIX: send response directly
//     return res
//       .status(200)
//       .json(successResponse(200, "Expenses retrieved successfully", expenses));
//   } catch (err) {
//     return next(createError(500, err.message));
//   }
// };

// module.exports = { createExpense, getGroupExpenses };

const Group = require("../models/Group");
const Expense = require("../models/Expense");
const mongoose = require("mongoose");
const createError = require("../utils/error");
const successResponse = require("../utils/response");
const logActivity = require("../utils/logActivity");
const notifyUser = require("../utils/notifyUser");

// --- Helper: Calculate user balance in a group ---
const calculateUserBalance = (expenses, settlements, userId) => {
  let balance = 0;

  // Process expenses
  for (const exp of expenses) {
    const paidAmount = exp.paidBy.toString() === userId ? exp.amount : 0;
    const userShare =
      exp.splits.find((s) => s.user.toString() === userId)?.amount || 0;
    balance += paidAmount - userShare;
  }

  // Process settlements
  for (const s of settlements) {
    if (s.from.toString() === userId) {
      balance -= s.amount; // Money you paid to others
    }
    if (s.to.toString() === userId) {
      balance += s.amount; // Money you received
    }
  }

  return balance;
};

// --- Create Expense ---
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

    if (
      !amount ||
      isNaN(amount) ||
      !paidBy ||
      !participants ||
      participants.length === 0
    )
      return next(
        createError(400, "Amount, paidBy, and participants are required")
      );

    if (!mongoose.Types.ObjectId.isValid(groupId))
      return next(createError(400, "Invalid group ID"));

    const group = await Group.findById(groupId);
    if (!group) return next(createError(404, "Group not found"));

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember)
      return next(createError(403, "You are not a member of this group"));

    // Split logic
    let splitAmounts = [];
    if (splitType === "equal") {
      const equalShare = parseFloat((amount / participants.length).toFixed(2));
      let totalAssigned = equalShare * participants.length;
      let diff = parseFloat((amount - totalAssigned).toFixed(2));
      splitAmounts = participants.map((userId, idx) => ({
        user: userId,
        amount:
          idx === participants.length - 1
            ? parseFloat((equalShare + diff).toFixed(2))
            : equalShare,
      }));
    } else if (splitType === "custom") {
      const totalSplit = splits.reduce((acc, s) => acc + Number(s.amount), 0);
      if (parseFloat(totalSplit.toFixed(2)) !== parseFloat(amount.toFixed(2)))
        return next(
          createError(400, "Custom splits do not add up to total amount")
        );
      splitAmounts = splits.map((s) => ({
        user: s.user,
        amount: parseFloat(s.amount),
      }));
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

    // Notify participants except creator
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

    return res
      .status(201)
      .json(successResponse(201, "Expense created successfully", savedExpense));
  } catch (err) {
    return next(createError(500, err.message));
  }
};

// --- Get Expenses in a Group ---
const getGroupExpenses = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(groupId))
      return next(createError(400, "Invalid group ID"));

    const group = await Group.findById(groupId);
    if (!group) return next(createError(404, "Group not found"));

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember)
      return next(createError(403, "You are not a member of this group"));

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("participants", "name email")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(successResponse(200, "Expenses retrieved successfully", expenses));
  } catch (err) {
    return next(createError(500, err.message));
  }
};

// --- Get All Groups with Balances ---
const getAllGroupsWithBalance = async (req, res, next) => {
  try {
    const groups = await Group.find({ "members.user": req.user._id });

    const groupsWithData = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.find({ group: group._id });
        const settlements = await Settlement.find({ group: group._id }); // Make sure this exists
        const yourBalance = calculateUserBalance(
          expenses,
          settlements,
          req.user._id
        );

        return {
          ...group.toObject(),
          yourBalance,
          expenses,
        };
      })
    );

    res
      .status(200)
      .json(
        successResponse(200, "Groups retrieved successfully", groupsWithData)
      );
  } catch (err) {
    next(createError(500, err.message));
  }
};

module.exports = {
  createExpense,
  getGroupExpenses,
  getAllGroupsWithBalance,
};
