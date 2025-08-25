  const User = require("../models/User");
  const createError = require("../utils/error");
  const jwt = require("jsonwebtoken");
  const crypto = require("crypto");
  const nodemailer = require("nodemailer");

  // ====================== REGISTER ======================

  const register = async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return next(createError(400, "All fields are required"));
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        return next(createError(400, "User already exists"));
      }

      const newUser = new User({ name, email, password });
      await newUser.save();

      newUser.password = undefined; // don’t send password back

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        user: newUser,
      });
    } catch (err) {
      return next(createError(500, err.message));
    }
  };

  // ====================== LOGIN ======================
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

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          token,
          user: { _id: user._id, name: user.name, email: user.email },
        },
      });
    } catch (err) {
      return next(createError(500, err.message));
    }
  };

  // ====================== FORGOT PASSWORD ======================
  const forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) return next(createError(404, "User not found"));

      // Generate token
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Hash & set to user model
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 mins

      await user.save();

      // Reset URL (frontend link)
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}?email=${email}`;

      // Email transport
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.MY_GMAIL,
          pass: process.env.MY_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: process.env.MY_GMAIL,
        to: email,
        subject: "Password Reset Request",
        text: `Click on this link to reset your password: ${resetUrl}`,
      });

      return res.status(200).json({
        success: true,
        message: "Password reset link sent to email",
      });
    } catch (err) {
      return next(createError(500, err.message));
    }
  };

  // ====================== RESET PASSWORD ======================
  const resetPassword = async (req, res, next) => {
    try {
      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return next(createError(400, "Invalid or expired token"));
      }

      if (!req.body.password) {
        return next(createError(400, "Password is required"));
      }

      // Set new password
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (err) {
      return next(createError(500, err.message));
    }
  };

  module.exports = { register, login, forgotPassword, resetPassword };
