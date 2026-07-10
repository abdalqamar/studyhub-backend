import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { CookieOptions } from "express";
import User from "../models/userModal.js";
import sendEmail from "../utils/sendEmail.js";
import generateTokens from "../utils/generateTokens.js";
import { generateUniqueOTP } from "../utils/generateUniqueOTP.js";
import OTP from "../models/OTPModal.js";
import Profile from "../models/profileModal.js";
import { resetPasswordTemplate } from "../template/resetPasswordTemplate.js";
import { passwordUpdateTemplate } from "../template/passwordUpdateTemplate.js";
import { emailVerificationTemplate } from "../template/emailVerificationTemplate.js";
import { AppError } from "../utils/AppError.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { TokenPayload } from "../types/auth.types.js";
import { IProfile } from "../types/profile.types.js";
import mongoose from "mongoose";
import PendingSignup from "../models/pendingSignup.model.js";

const isDevelopment = process.env.NODE_ENV === "development";

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
const validatePassword = (password: string) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(
    password || "",
  );

const REFRESH_TOKEN_MAX: number = 3;
const REFRESH_TOKEN_TTL_MS: number = 7 * 24 * 60 * 60 * 1000;

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  path: "/",
};

// Prune expired tokens, append new one, keep last 3
const buildRefreshTokenPipeline = (newToken: string) => [
  {
    $set: {
      refreshTokens: {
        $let: {
          vars: {
            filtered: {
              $filter: {
                input: "$refreshTokens",
                as: "rt",
                cond: { $ne: ["$$rt.token", newToken] },
              },
            },
          },
          in: {
            $slice: [
              {
                $concatArrays: [
                  "$$filtered",
                  [{ token: newToken, createdAt: new Date() }],
                ],
              },
              -REFRESH_TOKEN_MAX,
            ],
          },
        },
      },
    },
  },
  {
    $set: {
      lastActive: "$$NOW",
    },
  },
];

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log("=== SEND OTP HIT ===", JSON.stringify(req.body));
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !email || !password)
      return next(new AppError(400, "All fields are required"));
    if (!validateEmail(email))
      return next(new AppError(400, "Valid email is required"));
    if (password !== confirmPassword)
      return next(new AppError(400, "Passwords do not match"));
    if (!validatePassword(password)) {
      return next(new AppError(400, "Password must be at least 6 chars"));
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existUser = await User.findOne({ email: normalizedEmail });
    if (existUser) return next(new AppError(409, "User already registered"));

    const lastOtp = await OTP.findOne({ email: normalizedEmail }).sort({
      createdAt: -1,
    });
    const OTP_INTERVAL = 60 * 1000;
    if (lastOtp && Date.now() - lastOtp.createdAt.getTime() < OTP_INTERVAL) {
      const waitTime = Math.ceil(
        (OTP_INTERVAL - (Date.now() - lastOtp.createdAt.getTime())) / 1000,
      );
      return next(
        new AppError(
          429,
          `Please wait ${waitTime} seconds before requesting a new OTP`,
        ),
      );
    }

    const pending = await PendingSignup.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        password,
        createdAt: new Date(),
      },
      { upsert: true, new: true },
    );
    console.log("Pending:", pending);
    const { otp } = await generateUniqueOTP(email);
    await sendEmail(
      email,
      "Verification Email from StudyHub",
      emailVerificationTemplate(otp, firstName),
    );

    if (isDevelopment) console.log(`OTP for ${email}: ${otp}`);
    console.log("Otp is ", otp);
    return sendSuccess(res, 200, "OTP sent to your email");
  } catch (error) {
    return next(error);
  }
};

//  Register

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return next(new AppError(400, "Email and OTP are required"));
    if (!validateEmail(email))
      return next(new AppError(400, "Invalid email format"));

    session.startTransaction();

    const normalizedEmail = email.trim().toLowerCase();

    const existUser = await User.findOne({ email: normalizedEmail });
    if (existUser) return next(new AppError(409, "User already exists"));

    const validOtp = await OTP.findOne({ email: normalizedEmail }).sort({
      createdAt: -1,
    });
    if (!validOtp || validOtp.otp !== otp)
      return next(new AppError(400, "Invalid or expired OTP"));

    const pending = await PendingSignup.findOne({
      email: normalizedEmail,
    }).select("+password");
    if (!pending)
      return next(
        new AppError(400, "Signup session expired. Please register again."),
      );

    const [userProfile] = await Profile.create(
      [
        {
          gender: null,
          dateOfBirth: null,
          contactNumber: null,
          about: null,
          profileImage: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(`${pending.firstName} ${pending.lastName || ""}`)}`,
        },
      ],
      { session },
    );

    const [user] = await User.create(
      [
        {
          firstName: pending.firstName,
          lastName: pending.lastName || null,
          email: pending.email,
          password: pending.password,
          additionalInformation: userProfile._id,
        },
      ],
      { session },
    );

    await OTP.deleteOne({ _id: validOtp._id }, { session });
    await PendingSignup.deleteOne({ email: normalizedEmail }, { session });

    await session.commitTransaction();

    return sendSuccess(res, 201, "Registration successful", {
      user: { id: user._id, email: user.email, firstName: user.firstName },
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
};

//  Login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return next(new AppError(400, "Email and password are required"));
    if (!validateEmail(email))
      return next(new AppError(400, "Invalid email format"));

    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select("+password")
      .populate<{
        additionalInformation: IProfile;
      }>("additionalInformation", "profileImage");

    if (!user) return next(new AppError(401, "Invalid credentials"));
    if (user.status === "suspended")
      return next(
        new AppError(403, "Your account has been suspended. Contact support."),
      );

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return next(new AppError(401, "Invalid credentials"));

    const { accessToken, refreshToken } = generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await User.updateOne(
      { _id: user._id },
      buildRefreshTokenPipeline(refreshToken),
    );

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_TTL_MS,
    });

    return sendSuccess(res, 200, "Login successful", {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        profileImage: user.additionalInformation?.profileImage || null,
      },
    });
  } catch (error) {
    return next(error);
  }
};

//  Logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await User.updateOne(
        { "refreshTokens.token": refreshToken },
        { $pull: { refreshTokens: { token: refreshToken } } },
      );
    }
    res.clearCookie("refreshToken", cookieOptions);
    return sendSuccess(res, 200, "Logged out successfully");
  } catch (error) {
    return next(error);
  }
};

//  Forgot Password
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email))
      return next(new AppError(400, "Valid email is required"));

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return next(new AppError(404, "User not found"));

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

    return sendSuccess(
      res,
      200,
      "Password reset link sent to email successfully",
    );
  } catch (error) {
    return next(error);
  }
};

//  Reset Password
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    if (!token || !newPassword || !confirmNewPassword)
      return next(new AppError(400, "All fields are required"));

    if (newPassword !== confirmNewPassword)
      return next(new AppError(400, "Passwords do not match"));
    if (!validatePassword(newPassword)) {
      return next(
        new AppError(
          400,
          "Password must be at least 6 chars, include uppercase, number and special char",
        ),
      );
    }
    if (typeof token !== "string") {
      return next(new AppError(400, "Invalid token"));
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      "passwordResetData.token": hashedToken,
      "passwordResetData.expires": { $gt: new Date() },
    });

    if (!user)
      return next(
        new AppError(
          400,
          "Invalid or expired reset token. Please request a new password reset.",
        ),
      );

    user.password = newPassword;
    user.passwordResetData = undefined;
    user.refreshTokens = [];
    await user.save();

    await sendEmail(
      user.email,
      "Password Updated Successfully - StudyHub",
      passwordUpdateTemplate(user.email, user.firstName),
    );

    return sendSuccess(
      res,
      200,
      "Password reset successful. Please login again.",
    );
  } catch (error) {
    return next(error);
  }
};

//  Change Password
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword)
      return next(new AppError(400, "All fields are required"));
    if (newPassword !== confirmPassword)
      return next(new AppError(400, "Passwords do not match"));
    if (!validatePassword(newPassword)) {
      return next(
        new AppError(
          400,
          "Password must be at least 6 chars, include uppercase, number and special char",
        ),
      );
    }
    if (!req.user) return next(new AppError(404, "User not found"));

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return next(new AppError(404, "User not found"));

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return next(new AppError(401, "Old password is incorrect"));

    user.password = newPassword;
    user.refreshTokens = [];
    await user.save();

    await sendEmail(
      user.email,
      "Password Updated - StudyHub",
      passwordUpdateTemplate(user.email, user.firstName),
    );

    res.clearCookie("refreshToken", cookieOptions);

    return sendSuccess(
      res,
      200,
      "Password updated successfully. Please login again.",
    );
  } catch (error) {
    return next(error);
  }
};

//  Refresh Token
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken: tokenFromCookie } = req.cookies;
    if (!tokenFromCookie)
      return next(new AppError(401, "Refresh token not provided"));

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(
        tokenFromCookie,
        process.env.JWT_REFRESH_SECRET!,
      ) as TokenPayload;
    } catch (err) {
      res.clearCookie("refreshToken", cookieOptions);
      return sendError(res, 401, "Session expired, please login again", {
        code: "SESSION_EXPIRED",
      });
    }
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.some((t) => t.token === tokenFromCookie)) {
      return sendError(res, 401, "Invalid refresh token", {
        code: "INVALID_TOKEN",
      });
    }
    if (user.status === "suspended")
      return sendError(
        res,
        403,
        "Your account has been suspended. Contact support.",
      );

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Remove old token, add new one, keep last 3
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
                    cond: { $ne: ["$$rt.token", tokenFromCookie] },
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
                  -REFRESH_TOKEN_MAX,
                ],
              },
            },
          },
        },
      },
      {
        $set: {
          lastActive: "$$NOW",
        },
      },
    ]);

    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_TTL_MS,
    });

    return sendSuccess(res, 200, "Token refreshed successfully", {
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
      },
    });
  } catch (error) {
    return next(error);
  }
};
