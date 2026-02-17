import mongoose from "mongoose";
import Course from "../models/courseModal.js";
import RatingAndReviews from "../models/ratingAndRewiews.js";

// For create review
const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.id;
    const { rating, review } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // Check enrollment
    const courseDetails = await Course.findOne({
      _id: courseId,
      enrolledStudents: userId,
    });

    if (!courseDetails) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course.",
      });
    }

    // Prevent duplicate review
    const alreadyReviewed = await RatingAndReviews.findOne({
      user: userId,
      course: courseId,
    });

    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: "You have already reviewed this course.",
      });
    }

    // Create review
    const newReview = await RatingAndReviews.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });

    // Attach review to course
    await Course.findByIdAndUpdate(courseId, {
      $push: { ratingAndReviews: newReview._id },
    });

    // Recalculate average rating
    const avgResult = await RatingAndReviews.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const averageRating =
      avgResult.length > 0
        ? Number(avgResult[0].averageRating.toFixed(1))
        : rating;

    await Course.findByIdAndUpdate(courseId, {
      averageRating,
    });

    return res.status(201).json({
      success: true,
      message: "Rating and review added successfully",
      data: newReview,
    });
  } catch (error) {
    return next(error);
  }
};

// Delete review controller
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Review find karo
    const review = await RatingAndReviews.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const courseId = review.course;

    //  Review delete karo
    await RatingAndReviews.findByIdAndDelete(id);

    // Course se review id hatao
    await Course.findByIdAndUpdate(courseId, {
      $pull: { ratingAndReviews: id },
    });

    //  Average dobara calculate karo
    const avgResult = await RatingAndReviews.aggregate([
      {
        $match: {
          course: courseId,
        },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const averageRating =
      avgResult.length > 0 ? Number(avgResult[0].averageRating.toFixed(1)) : 0;

    // Course update karo
    await Course.findByIdAndUpdate(courseId, {
      averageRating,
    });

    return res.status(200).json({
      success: true,
      message: "Review deleted & average rating updated",
    });
  } catch (error) {
    return next(error);
  }
};

// update review controller
const updateReview = async (req, res, next) => {};

export { createReview, updateReview, deleteReview };
