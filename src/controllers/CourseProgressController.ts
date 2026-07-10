import mongoose from "mongoose";
import CourseProgress from "../models/courseProgressModal.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { Request, Response, NextFunction } from "express";

export const markComplete = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    const userId = req.user.id;

    const { courseId, lessonId } = req.params as {
      courseId: string;
      lessonId: string;
    };

    const progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress)
      return next(
        new AppError(
          404,
          "Course progress not found. Are you enrolled in this course?",
        ),
      );

    const alreadyDone = progress.completedVideos.some(
      (id) => id.toString() === lessonId,
    );
    if (!alreadyDone) {
      progress.completedVideos.push(new mongoose.Types.ObjectId(lessonId));
    }
    progress.progressPercentage = progress.totalVideos
      ? Math.round(
          (progress.completedVideos.length / progress.totalVideos) * 100,
        )
      : 0;

    await progress.save();

    return sendSuccess(res, 200, "Lesson marked complete", { progress });
  } catch (error) {
    return next(error);
  }
};
