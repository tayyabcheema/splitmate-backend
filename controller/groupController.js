const mongoose = require("mongoose");
const Group = require("../models/Group");
const Expense = require("../models/Expense");
const createError = require("../utils/error");
const successResponse = require("../utils/response");
const generateInviteCode = require("../utils/generateInviteCode");
const Settlement = require("../models/Settlement");
const { Parser } = require("json2csv");
const logActivity = require("../utils/logActivity");
const notifyUser = require("../utils/notifyUser");
const User = require("../models/User")

const createGroup = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return next(createError(400, "Group name is required"));
    }
    const group = await Group.findOne({ name, createdBy: req.user._id });
    if (group) {
      return next(createError(400, "Group already exists"));
    }
    const newGroup = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: "admin" }],
    });
    return next(successResponse(201, "Group created successfully", newGroup));
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const getAllGroups = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const groups = await Group.find({
      $or: [
        { createdBy: userId },
        { "members.user": userId },
      ],
    }).populate("createdBy", "name email")
      .populate("members.user", "name email");

    return next(successResponse(200, "Groups fetched successfully", groups));
  } catch (err) {
    return next(createError(500, err.message));
  }
};


const updateGroup = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(createError(400, "Invalid group ID"));
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return next(createError(404, "Group not found"));
    }
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return next(
        createError(403, "You do not have permission to update this group")
      );
    }
    group.name = name || group.name;
    group.description = description || group.description;
    const updatedGroup = await group.save();
    for (const member of group.members) {
      // Optional: skip the user who updated the group
      if (member.user.toString() !== req.user._id.toString()) {
        await notifyUser(member.user, {
          type: "group_updated",
          message: `Group details were updated by ${req.user.name}`,
          meta: { groupId: group._id },
        });
      }
    }

    return next(
      successResponse(200, "Group updated successfully", updatedGroup)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const getGroupBalances = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(createError(400, "Invalid group ID"));
    }

    const group = await Group.findById(groupId).populate(
      "members.user",
      "name email"
    );
    if (!group) {
      return next(createError(404, "Group not found"));
    }

    const isMember = group.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return next(createError(403, "You are not a member of this group"));
    }

    const expenses = await Expense.find({ group: groupId });
    const settlements = await Settlement.find({ group: groupId });

    // Initialize balances
    const balances = {};
    group.members.forEach((member) => {
      balances[member.user._id.toString()] = {
        user: {
          _id: member.user._id,
          name: member.user.name,
          email: member.user.email,
        },
        netBalance: 0,
      };
    });

    // Process expenses
    for (const expense of expenses) {
      const payerId = expense.paidBy.toString();
      const amount = expense.amount;

      if (balances[payerId]) {
        balances[payerId].netBalance += amount;
      }

      for (const split of expense.splits) {
        const participantId = split.user.toString();
        const splitAmount = split.amount;

        if (balances[participantId]) {
          balances[participantId].netBalance -= splitAmount;
        }
      }
    }

    // Process settlements
    for (const settlement of settlements) {
      const fromId = settlement.from.toString();
      const toId = settlement.to.toString();
      const amount = Number(settlement.amount); // ensure it's a number

      if (balances[toId]) {
        balances[toId].netBalance -= amount; // receiver receives less
      }

      if (balances[fromId]) {
        balances[fromId].netBalance += amount; // payer owes less
      }
    }

    const result = Object.values(balances);

    return next(
      successResponse(200, "Group balances retrieved successfully", result)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const generateGroupInvite = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return next(createError(404, "Group not found"));
    }

    if (group.createdBy.toString() !== req.user._id.toString()) {
      return next(
        createError(
          403,
          "You are not authorized to generate invite code for this group"
        )
      );
    }

    // Generate new invite code
    group.inviteCode = generateInviteCode();
    await group.save();
    for (const member of group.members) {
      if (member.user._id.toString() !== req.user._id.toString()) {
        await notifyUser(member.user._id, {
          type: "invite_code_generated",
          message: `${req.user.name} generated a new invite code for the group.`,
          meta: { groupId: group._id, inviteCode: group.inviteCode },
        });
      }
    }

    return next(
      successResponse(200, "Invite code generated successfully", {
        inviteCode: group.inviteCode,
      })
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const joinGroupByInvite = async (req, res, next) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return next(createError(400, "Invite code is required"));
    }

    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return next(createError(404, "Invalid or expired invite code"));
    }

    const alreadyMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (alreadyMember) {
      return next(createError(400, "You are already a member of this group"));
    }

    group.members.push({ user: req.user._id, role: "member" });
    await group.save();
    for (const member of group.members) {
      if (member.user._id.toString() !== req.user._id.toString()) {
        await notifyUser(member.user._id, {
          type: "member_joined",
          message: `${req.user.name} has joined the group "${group.name}".`,
          meta: { groupId: group._id, newMemberId: req.user._id },
        });
      }
    }

    return next(
      successResponse(200, "Successfully joined the group", {
        groupId: group._id,
        groupName: group.name,
      })
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

    // Check membership
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return next(createError(403, "You are not a member of this group"));
    }

    // Build filters
    const { category, payer, startDate, endDate } = req.query;

    const filters = { group: groupId };

    if (category) filters.category = category;
    if (payer) filters.paidBy = payer;
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filters)
      .populate("paidBy", "name email")
      .populate("splits.user", "name email")
      .sort({ createdAt: -1 });

    return next(
      successResponse(200, "Group expenses retrieved successfully", expenses)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const exportGroupExpensesCSV = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(createError(400, "Invalid group ID"));
    }

    const group = await Group.findById(groupId);
    if (!group) return next(createError(404, "Group not found"));

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return next(createError(403, "You are not a member of this group"));
    }

    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("splits.user", "name email");

    const csvData = expenses.map((e) => ({
      Description: e.description,
      Category: e.category,
      PaidBy: e.paidBy?.name || "",
      Amount: e.amount,
      Currency: e.currency,
      Date: new Date(e.createdAt).toLocaleString(),
      SplitDetails: e.splits
        .map((s) => `${s.user?.name}: ${s.amount}`)
        .join(", "),
    }));

    const parser = new Parser();
    const csv = parser.parse(csvData);

    res.header("Content-Type", "text/csv");
    res.attachment(`group-${groupId}-expenses.csv`);
    return res.send(csv);
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const leaveGroup = async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const userId = req.user._id.toString();

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(createError(400, "Invalid group ID"));
    }

    const group = await Group.findById(groupId).populate(
      "members.user",
      "name email"
    );
    if (!group) return next(createError(404, "Group not found"));

    // Check if user is a member
    const isMember = group.members.some(
      (m) => m.user._id.toString() === userId
    );
    if (!isMember)
      return next(createError(403, "You are not a member of this group"));

    // Get balances like getGroupBalances
    const expenses = await Expense.find({ group: groupId });
    const settlements = await Settlement.find({ group: groupId });

    const balances = {};
    group.members.forEach((m) => {
      balances[m.user._id.toString()] = { netBalance: 0 };
    });

    for (const expense of expenses) {
      balances[expense.paidBy.toString()].netBalance += expense.amount;
      for (const split of expense.splits) {
        balances[split.user.toString()].netBalance -= split.amount;
      }
    }

    for (const s of settlements) {
      balances[s.from.toString()].netBalance -= s.amount;
      balances[s.to.toString()].netBalance += s.amount;
    }

    const userBalance = parseFloat(
      balances[userId]?.netBalance.toFixed(2) || 0
    );

    if (Math.abs(userBalance) > 0.01) {
      return next(
        createError(
          400,
          `You cannot leave the group until your balance is settled (current: ${userBalance})`
        )
      );
    }

    // Remove user from the group
    group.members = group.members.filter(
      (m) => m.user._id.toString() !== userId
    );
    await group.save();

    // Optional: log activity
    const responseMessage = `You have left the group ${group.name} successfully.`;
    await logActivity({
      group: groupId,
      user: req.user._id,
      type: "group_left",
      message: `${req.user.name} left the group.`,
    });

    for (const member of group.members) {
      await notifyUser(member.user._id, {
        type: "member_left",
        message: `${req.user.name} has left the group "${group.name}".`,
        meta: { groupId, userId },
      });
    }

    return next(
      successResponse(
        200,
        "You have left the group successfully",
        responseMessage
      )
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

module.exports = {
  createGroup,
  updateGroup,
  getGroupBalances,
  generateGroupInvite,
  joinGroupByInvite,
  getGroupExpenses,
  exportGroupExpensesCSV,
  leaveGroup,
  getAllGroups
};
