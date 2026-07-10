import mongoose from "mongoose";

export interface IUser {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  role: "student" | "instructor" | "admin";
  status: "active" | "inactive" | "suspended";
  lastActive: Date;
  enrolledCourses: mongoose.Types.ObjectId[];
  additionalInformation: mongoose.Types.ObjectId;
  courseProgress: mongoose.Types.ObjectId[];
  refreshTokens: { token: string; createdAt: Date }[];
  passwordResetData?: { token: string; expires: Date };
  comparePassword: (password: string) => Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}
