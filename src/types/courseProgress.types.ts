import mongoose from "mongoose";

export interface ICourseProgress {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  completedVideos: mongoose.Types.ObjectId[];
  totalVideos: number;
  progressPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}
