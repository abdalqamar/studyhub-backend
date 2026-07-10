import mongoose from "mongoose";
import Section from "../models/sectionModal.js";
import Course from "../models/courseModal.js";
import Lesson from "../models/lessonModal.js";
import { verifyCourseOwnership } from "../utils/verifyCourseOwnership.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { Request, Response, NextFunction } from "express";

export const createSection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const { courseId } = req.params as Record<string, string>;
    const { sectionName } = req.body;

    if (!sectionName?.trim()) {
      return next(new AppError(400, "sectionName is required"));
    }

    const check = await verifyCourseOwnership(courseId.toString(), req.user);
    if (!check.ok) {
      return next(new AppError(check.status, check.message));
    }

    const course = check.course;
    if (course.status === "rejected" || course.status === "approved") {
      course.status = "pending";
      course.feedback = "";
      await course.save();
    }

    // Section.create + Course.$addToSet must be atomic — if the Course
    // update fails after the Section is created, we end up with an orphan
    // Section document that's not referenced by any course.
    const session = await mongoose.startSession();
    let section;

    try {
      session.startTransaction();

      [section] = await Section.create([{ sectionName: sectionName.trim() }], {
        session,
      });

      // $addToSet instead of $push — prevents duplicate references if
      // this code path is hit twice for the same section (e.g. retry).
      await Course.findByIdAndUpdate(
        courseId,
        { $addToSet: { courseContent: section._id } },
        { session },
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return sendSuccess(res, 201, "Section created successfully", { section });
  } catch (error) {
    return next(error);
  }
};

export const updateSection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const { sectionId, courseId } = req.params as Record<string, string>;
    const { sectionName } = req.body;

    if (!sectionName?.trim()) {
      return next(new AppError(400, "sectionName is required"));
    }

    const check = await verifyCourseOwnership(courseId.toString(), req.user);
    if (!check.ok) {
      return next(new AppError(check.status, check.message));
    }

    // Verify the section actually belongs to this course — without this,
    // an instructor could pass their own valid courseId (ownership check
    // passes) but a sectionId from another instructor's course (IDOR).
    const courseHasSection = await Course.exists({
      _id: courseId,
      courseContent: new mongoose.Types.ObjectId(sectionId),
    });
    if (!courseHasSection) {
      return next(new AppError(404, "Section not found"));
    }

    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName: sectionName.trim() },
      { new: true },
    ).populate("lesson");

    if (!section) return next(new AppError(404, "Section not found"));

    return sendSuccess(res, 200, "Section updated successfully", { section });
  } catch (error) {
    return next(error);
  }
};

export const deleteSection = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const { courseId, sectionId } = req.params as Record<string, string>;

    const check = await verifyCourseOwnership(courseId.toString(), req.user);
    if (!check.ok) {
      return next(new AppError(check.status, check.message));
    }

    // Same IDOR fix as updateSection — verify section belongs to this
    // course before allowing deletion.
    const courseHasSection = await Course.exists({
      _id: courseId,
      courseContent: new mongoose.Types.ObjectId(sectionId),
    });
    if (!courseHasSection) {
      return next(new AppError(404, "Section not found"));
    }

    const section = await Section.findById(sectionId);
    if (!section) return next(new AppError(404, "Section not found"));

    const lessonIds = section.lesson ?? [];

    // All three deletes must be atomic — in the original code, lessons
    // were deleted first (no rollback possible), then Course pull, then
    // Section delete. If Course pull failed: lessons were gone but section
    // + dead references remained in the course (corrupt state).
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      if (lessonIds.length > 0) {
        await Lesson.deleteMany({ _id: { $in: lessonIds } }, { session });
      }

      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { courseContent: new mongoose.Types.ObjectId(sectionId) } },
        { session },
      );

      await Section.findByIdAndDelete(sectionId, { session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return sendSuccess(res, 200, "Section deleted successfully", { sectionId });
  } catch (error) {
    return next(error);
  }
};
