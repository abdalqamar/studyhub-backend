import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import { IUser } from "../types/user.types.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: 20,
      minlength: 3,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 20,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: "Please enter a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    additionalInformation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    courseProgress: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseProgress",
      },
    ],
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    passwordResetData: {
      token: { type: String },
      expires: { type: Date },
    },
  },

  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ role: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ enrolledCourses: 1 });

const User = mongoose.model<IUser>("User", userSchema);
export default User;
