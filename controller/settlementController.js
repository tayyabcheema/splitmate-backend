const Settlement = require("../models/Settlement");
const Group = require("../models/Group");
const createError = require("../utils/error");
const successResponse = require("../utils/response");
const mongoose = require("mongoose");
const logActivity = require("../utils/logActivity");
const notifyUser = require("../utils/notifyUser");

const createSettlement = async (req, res, next) => {
  try {
    const { groupId, to, amount, note, method } = req.body;

    if (!groupId || !to || !amount || !method) {
      return next(createError(400, "Missing required fields"));
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return next(createError(404, "Group not found"));
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return next(createError(403, "You are not a member of this group"));
    }

    const settlement = await Settlement.create({
      group: groupId,
      from: req.user._id,
      to,
      amount,
      note,
      method,
      settledAt: new Date(),
    });

    // Log activity
    await logActivity({
      group: groupId,
      user: req.user._id,
      type: "settlement_made",
      message: `Settled PKR ${amount} with user ${to}`,
      meta: { settlementId: settlement._id },
    });

    // 🔔 Notify the payer
    await notifyUser(req.user._id, {
      type: "settlement_made",
      message: `You paid PKR ${amount} to ${to}`,
      meta: { settlementId: settlement._id, to },
    });

    // 🔔 Notify the receiver
    await notifyUser(to, {
      type: "settlement_received",
      message: `You received PKR ${amount} from ${req.user.name}`,
      meta: { settlementId: settlement._id, from: req.user._id },
    });

    return next(
      successResponse(201, "Settlement created successfully", settlement)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const getGroupSettlements = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return next(createError(400, "Invalid group ID"));
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return next(createError(404, "Group not found"));
    }

    // Verify user is a group member
    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return next(createError(403, "You are not a member of this group"));
    }

    const settlements = await Settlement.find({ group: groupId })
      .populate("from", "name email")
      .populate("to", "name email")
      .sort({ settledAt: -1 });

    return res
      .status(200)
      .json(
        successResponse(
          200,
          "Settlement history retrieved successfully",
          settlements
        )
      );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

module.exports = { createSettlement, getGroupSettlements };
