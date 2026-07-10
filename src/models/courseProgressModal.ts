import mongoose from "mongoose";
import { ICourseProgress } from "../types/courseProgress.types.js";

const courseProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },

  completedVideos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
  ],

  totalVideos: {
    type: Number,
    required: true,
  },

  progressPercentage: {
    type: Number,
    default: 0,
  },
});

courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const CourseProgress = mongoose.model<ICourseProgress>(
  "CourseProgress",
  courseProgressSchema,
);
export default CourseProgress;
