import mongoose from "mongoose";
import Course from "../models/courseModal.js";
import RatingAndReviews from "../models/ratingAndRewiews.js";
import { AppError } from "../utils/AppError.js";
import { sendSuccess } from "../utils/response.js";
import { Request, Response, NextFunction } from "express";

const recalculateAvgRating = async (
  courseId: string,
  session?: mongoose.ClientSession,
) => {
  const aggResult = await RatingAndReviews.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    { $group: { _id: null, averageRating: { $avg: "$rating" } } },
  ]).session(session ?? null);

  const averageRating = aggResult.length
    ? Number(aggResult[0].averageRating.toFixed(1))
    : 0;

  await Course.findByIdAndUpdate(courseId, { averageRating }, { session });

  return averageRating;
};

const isValidRating = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 5;

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const userId = req.user.id;
    const courseId = req.params.id;
    const { rating, review } = req.body;

    if (!isValidRating(rating)) {
      return next(
        new AppError(400, "Rating must be a whole number between 1 and 5"),
      );
    }

    const course = await Course.findOne({
      _id: courseId,
      enrolledStudents: userId,
    });
    if (!course) {
      return next(new AppError(403, "You are not enrolled in this course"));
    }

    const already = await RatingAndReviews.findOne({
      user: userId,
      course: courseId,
    });
    if (already) {
      return next(new AppError(409, "You have already reviewed this course"));
    }

    const session = await mongoose.startSession();
    let newReview;

    try {
      session.startTransaction();

      [newReview] = await RatingAndReviews.create(
        [{ rating, review, course: courseId, user: userId }],
        { session },
      );

      await Course.findByIdAndUpdate(
        courseId,
        { $addToSet: { ratingAndReviews: newReview._id } },
        { session },
      );

      await recalculateAvgRating(courseId.toString(), session);

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return sendSuccess(res, 201, "Review added successfully", {
      review: newReview,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const { reviewId } = req.params;
    const { rating, review } = req.body;

    if (rating === undefined && review === undefined) {
      return next(
        new AppError(
          400,
          "Provide at least one field to update (rating or review)",
        ),
      );
    }

    if (rating !== undefined && !isValidRating(rating)) {
      return next(
        new AppError(400, "Rating must be a whole number between 1 and 5"),
      );
    }

    const existing = await RatingAndReviews.findOne({
      _id: reviewId,
      user: req.user.id,
    });
    if (!existing) return next(new AppError(404, "Review not found"));

    if (rating !== undefined) existing.rating = rating;
    if (review !== undefined) existing.review = review;
    await existing.save();

    await recalculateAvgRating(existing.course.toString());

    return sendSuccess(res, 200, "Review updated successfully", {
      review: existing,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return next(new AppError(401, "Unauthorized"));
    }

    const { reviewId } = req.params as Record<string, string>;

    const review = await RatingAndReviews.findById(reviewId);
    if (!review) return next(new AppError(404, "Review not found"));

    if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new AppError(403, "You are not authorized to delete this review"),
      );
    }

    const courseId = review.course;

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      await RatingAndReviews.findByIdAndDelete(reviewId, { session });

      await Course.findByIdAndUpdate(
        courseId,
        {
          $pull: {
            ratingAndReviews: new mongoose.Types.ObjectId(reviewId),
          },
        },
        { session },
      );

      await recalculateAvgRating(courseId.toString(), session);

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return sendSuccess(res, 200, "Review deleted successfully");
  } catch (error) {
    return next(error);
  }
};
