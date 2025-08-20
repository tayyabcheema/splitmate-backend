const Activity = require("../models/Activity");
const Group = require("../models/Group");
const createError = require("../utils/error");
const successResponse = require("../utils/response");

const getGroupActivities = async (req, res, next) => {
  try {
    const groupId = req.params.id;

    const group = await Group.findById(groupId);
    if (!group) return next(createError(404, "Group not found"));

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) return next(createError(403, "You are not a member of this group"));

    const activities = await Activity.find({ group: groupId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(
      successResponse(200, "Activity log retrieved successfully", activities)
    );
  } catch (err) {
    return next(createError(500, err.message));
  }
};

module.exports = { getGroupActivities };
