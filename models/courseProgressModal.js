import mongoose from "mongoose";

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

const CourseProgress = mongoose.model("CourseProgress", courseProgressSchema);
export default CourseProgress;
