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

const isDevelopment = process.env.NODE_ENV !== "production";

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

const validatePassword = (password) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(
    password || "",
  );

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid email is required" });
    }

    const existUser = await User.findOne({ email });
    if (existUser) {
      return res
        .status(401)
        .json({ success: false, message: "User already registered" });
    }

    const lastOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
    const OTP_INTERVAL = 60 * 1000;
    if (lastOtp && Date.now() - lastOtp.createdAt.getTime() < OTP_INTERVAL) {
      const waitTime = Math.ceil(
        (OTP_INTERVAL - (Date.now() - lastOtp.createdAt.getTime())) / 1000,
      );
      return res.status(400).json({
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
      });
    }

    const { otp } = await generateUniqueOTP(email);
    if (isDevelopment) {
      console.log(`OTP for ${email}: ${otp}`);
    }

    return res
      .status(200)
      .json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    if (isDevelopment) console.error("sendOtp error:", error);
    return res
      .status(500)
      .json({ success: false, message: "OTP not generated" });
  }
};

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, otp } =
      req.body;

    if (!firstName || !email || !password || !confirmPassword || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 chars, include uppercase, number and special char",
      });
    }

    const existUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existUser)
      return res
        .status(401)
        .json({ success: false, message: "User already exists" });

    const validOtp = await OTP.findOne({
      email: email.trim().toLowerCase(),
    }).sort({ createdAt: -1 });
    if (!validOtp || validOtp.otp !== otp) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    const userProfile = await Profile.create({
      gender: null,
      dateOfBirth: null,
      contactNumber: null,
      about: null,
      profileImage: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(`${firstName} ${lastName || ""}`)}`,
    });

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      email: email.trim().toLowerCase(),
      password,
      additionalInformation: userProfile._id,
    });

    await OTP.deleteOne({ _id: validOtp._id });

    return res.status(200).json({
      success: true,
      message: "Registration successful",
      user: { id: user._id, email: user.email, firstName: user.firstName },
    });
  } catch (error) {
    if (isDevelopment) console.error("register error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    if (!validateEmail(email))
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).populate("additionalInformation", "profileImage");
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    if (user.status === "suspended")
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Contact support.",
      });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // update
    await User.updateOne({ _id: user._id }, [
      {
        $set: {
          refreshTokens: {
            $let: {
              vars: {
                recent: {
                  $filter: {
                    input: "$refreshTokens",
                    as: "rt",
                    cond: {
                      $gt: [
                        "$$rt.createdAt",
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      ],
                    },
                  },
                },
              },
              in: {
                $slice: [
                  {
                    $concatArrays: [
                      "$$recent",
                      [{ token: refreshToken, createdAt: new Date() }],
                    ],
                  },
                  -3,
                ],
              },
            },
          },
          lastActive: new Date(),
        },
      },
    ]);

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      domain: isProd ? ".studyhubedu.online" : undefined,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
      },
    });
  } catch (error) {
    if (isDevelopment) console.error("login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await User.updateOne(
        { "refreshTokens.token": refreshToken },
        {
          $pull: { refreshTokens: { token: refreshToken } },
        },
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    if (isDevelopment) console.error("logout error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email))
      return res
        .status(400)
        .json({ success: false, message: "Valid email is required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

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
      user.email,
      "Reset Your Password - StudyHub (Valid for 5 minutes)",
      resetPasswordTemplate(user.email, user.firstName, url),
    );

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to email successfully",
    });
  } catch (error) {
    if (isDevelopment) console.error("forgotPassword error:", error);
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
    if (!token || !newPassword || !confirmNewPassword)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    if (newPassword !== confirmNewPassword)
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    if (!validatePassword(newPassword))
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 chars, include uppercase, number and special char",
      });

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      "passwordResetData.token": hashedToken,
      "passwordResetData.expires": { $gt: new Date() },
    });
    if (!user)
      return res.status(400).json({
        success: false,
        message:
          "Invalid or expired reset token. Please request a new password reset.",
      });

    user.password = newPassword;
    user.passwordResetData = undefined;
    user.refreshTokens = [];
    await user.save();

    await sendEmail(
      user.email,
      "Password Updated Successfully - StudyHub",
      passwordUpdateTemplate(user.email, user.firstName),
    );
    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login again.",
    });
  } catch (error) {
    if (isDevelopment) console.error("resetPassword error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.user;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    if (newPassword !== confirmPassword)
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    if (!validatePassword(newPassword))
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 chars, include uppercase, number and special char",
      });

    const user = await User.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Old password is incorrect" });

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    await sendEmail(
      user.email,
      "Password Updated - StudyHub",
      passwordUpdateTemplate(user.email, user.firstName),
    );

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. Please login again.",
    });
  } catch (error) {
    if (isDevelopment) console.error("changePassword error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: refreshTokenCookie } = req.cookies;
    if (!refreshTokenCookie)
      return res
        .status(401)
        .json({ success: false, message: "Refresh token not provided" });

    let decoded;
    try {
      decoded = jwt.verify(refreshTokenCookie, process.env.JWT_REFRESH_SECRET);
    } catch {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id);
    if (
      !user ||
      !user.refreshTokens.some((t) => t.token === refreshTokenCookie)
    ) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }
    if (user.status === "suspended")
      return res
        .status(403)
        .json({ success: false, message: "Your account has been suspended" });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // remove old token, append new, keep last 3
    await User.updateOne({ _id: user._id }, [
      {
        $set: {
          refreshTokens: {
            $let: {
              vars: {
                filtered: {
                  $filter: {
                    input: "$refreshTokens",
                    as: "rt",
                    cond: { $ne: ["$$rt.token", refreshTokenCookie] },
                  },
                },
              },
              in: {
                $slice: [
                  {
                    $concatArrays: [
                      "$$filtered",
                      [{ token: newRefreshToken, createdAt: new Date() }],
                    ],
                  },
                  -3,
                ],
              },
            },
          },
        },
      },
    ]);

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      domain: isProd ? ".studyhubedu.online" : undefined,
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
      },
    });
  } catch (error) {
    if (isDevelopment) console.error("refreshToken error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
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
