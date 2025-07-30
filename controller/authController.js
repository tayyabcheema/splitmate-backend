const User = require("../models/User");
const createError = require("../utils/error");
const createSuccess = require("../utils/response");
const jwt = require("jsonwebtoken");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(createError(400, "All fields are required"));
    }

    const user = await User.findOne({ email });
    if (user) {
      return next(createError(400, "User already exists"));
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    return next(createSuccess(201, "User created successfully", newUser));
  } catch (err) {
    return next(createError(500, err.message));
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError(400, "Email and password are required"));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError(400, "Invalid credentials"));
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return next(createSuccess(200, "Login successful", { token }));
  } catch (err) {
    return next(createError(500, err.message));
  }
};

module.exports = { register, login };
