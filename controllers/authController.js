import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/userModal.js";
import sendEmail from "../utils/sendEmail.js";
import generateTokens from "../utils/generateTokens.js";
import generateUniqueOTP from "../utils/generateUniqueOTP.js";
import OTP from "../models/OTPModal.js";
import Profile from "../models/profileModal.js";
import resetPasswordTemplate from "../template/resetPasswordTemplate.js";
import passwordUpdateTemplate from "../template/passwordUpdateTemplate.js";

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(401).json({
        success: false,
        message: "user already registered",
      });
    }
    const lastOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
    const OTP_INTERVAL = 60 * 1000;
    if (lastOtp && Date.now() - lastOtp.createdAt.getTime() < OTP_INTERVAL) {
      const waitTime = Math.ceil(
        (OTP_INTERVAL - (Date.now() - lastOtp.createdAt.getTime())) / 1000
      );
      return res.status(400).json({
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
      });
    }
    const { otp } = await generateUniqueOTP(email);
    res.status(200).json({
      success: true,
      message: "OTP Sent Successfully",
      otp,
    });
  } catch (error) {
    console.error("Send OTP Error", error);
    res.status(500).json({
      success: false,
      message: "OTP not generated",
    });
  }
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, otp } =
      req.body;
    if (
      [firstName, email, password, confirmPassword, otp].some(
        (field) => field?.trim() === ""
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(401).json({
        success: false,
        message: "User already exist",
      });
    }

    if (password !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "Passwrd and confirom password do not match",
      });
    }

    const validOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (validOtp.otp !== req.body.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const userProfile = await Profile.create({
      gender: null,
      dateOfBirth: null,
      contactNumber: null,
      about: null,
      profileImage: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        `${firstName} ${lastName}`
      )}`,
    });

    const user = await User.create({
      firstName,
      lastName: lastName || null,
      email,
      password,
      additionalInformation: userProfile._id,
    });

    return res.status(200).json({
      success: true,
      message: "registred successful",
      user,
    });
  } catch (error) {
    console.error("register error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    const user = await User.findOne({ email }).populate(
      "additionalInformation",
      "profileImage"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Password check
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate access and refresh tokens
    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    user.refreshTokens = user.refreshTokens.filter(
      (token) =>
        token.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000 > Date.now()
    );

    // Save refresh token in DB
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
    });

    if (user.refreshTokens.length > 3) {
      user.refreshTokens = user.refreshTokens.slice(-3);
    }

    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successfully",
      accessToken: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.clearCookie("refreshToken", { httpOnly: true });
      return res
        .status(200)
        .json({ success: true, message: "Logged out successfully" });
    }

    await User.updateOne(
      { "refreshTokens.token": refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );

    res.clearCookie("refreshToken", { httpOnly: true });
    console.log("Logged out successfully");
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.passwordResetData = undefined;
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetData = {
      token: hashedToken,
      expires: new Date(Date.now() + 5 * 60 * 1000),
    };

    await user.save({ validateBeforeSave: false });

    const url = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail(
      email,
      "Reset Your Password - StudyHub (Valid for 5 minutes)",
      resetPasswordTemplate(email, user.fullName, url)
    );

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to email successfully",
    });
  } catch (error) {
    console.error("Forgot Password error:", error);
    return res.status(500).json({
      success: false,
      message: "Error while sending reset link to email",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    if (!newPassword || !confirmNewPassword || !token) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await User.findOne({
      "passwordResetData.token": hashedToken,
      "passwordResetData.expires": { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired reset token. Please request a new password reset",
      });
    }
    user.password = newPassword;
    // Clear reset token data
    user.passwordResetData = undefined;

    // Clear all refresh tokens and force re-login on all devices
    user.refreshTokens = [];
    await user.save();

    await sendEmail(
      user.email,
      "Password Updated Successfully - StudyHub",
      passwordUpdateTemplate(user.email, user.fullName)
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error(error.message);
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

const changePassword = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const userId = req.user.id;
    const { confirmPassword, currentPassword, newPassword } = req.body;
    const user = await User.findById(userId);
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const isMatch = user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    const mailResponse = await sendEmail(
      user.email,
      "Password update email",
      passwordUpdateTemplate(user.email, user.fullName)
    );

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log("Error while updating password");
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: refreshTokenCookie } = req.cookies;

    if (!refreshTokenCookie) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not provided",
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshTokenCookie, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    // Find user and validate refresh token
    const user = await User.findById(decoded.id);
    if (
      !user ||
      !user.refreshTokens.some(
        (tokenObj) => tokenObj.token === refreshTokenCookie
      )
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new tokens
    const newToken = generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    user.refreshTokens = user.refreshTokens.filter(
      (tokenObj) => tokenObj.token !== refreshTokenCookie
    );
    user.refreshTokens.push({
      token: newToken.refreshToken,
      createdAt: new Date(),
    });
    if (user.refreshTokens.length > 3) {
      user.refreshTokens = user.refreshTokens.slice(-3);
    }
    await user.save();

    res.cookie("refreshToken", newToken.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newToken.accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
  sendOtp,
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
};
