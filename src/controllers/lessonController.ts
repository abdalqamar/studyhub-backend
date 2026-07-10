import { sendSuccess } from "../utils/response.js";
import { verifyCourseOwnership } from "../utils/verifyCourseOwnership.js";
import * as lessonService from "../services/lessonService.js";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";

export const createLesson = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    const { courseId, sectionId } = req.params as Record<string, string>;

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const videoFile = files?.videoFile?.[0];

    if (!videoFile) {
      return next(new AppError(400, "Video file is required"));
    }

    const check = await verifyCourseOwnership(courseId, req.user);
    if (!check.ok) return next(new AppError(check.status, check.message));

    const lesson = await lessonService.createLesson(
      req.body,
      courseId,
      sectionId,
      videoFile,
    );
    return sendSuccess(res, 201, "Lesson created successfully", { lesson });
  } catch (error) {
    return next(error);
  }
};

export const updateLesson = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    const { courseId, lessonId } = req.params as Record<string, string>;

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const videoFile = files?.videoFile?.[0] || null;

    const check = await verifyCourseOwnership(courseId, req.user);
    if (!check.ok) return next(new AppError(check.status, check.message));

    const lesson = await lessonService.updateLesson(
      lessonId,
      courseId,
      req.body,
      videoFile,
    );
    return sendSuccess(res, 200, "Lesson updated successfully", { lesson });
  } catch (error) {
    return next(error);
  }
};

export const deleteLesson = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }
    const { courseId, sectionId, lessonId } = req.params as Record<
      string,
      string
    >;

    const check = await verifyCourseOwnership(courseId, req.user);
    if (!check.ok) return next(new AppError(check.status, check.message));

    await lessonService.deleteLesson(lessonId, sectionId, courseId);
    return sendSuccess(res, 200, "Lesson deleted successfully", {
      lessonId,
      sectionId,
    });
  } catch (error) {
    return next(error);
  }
};
