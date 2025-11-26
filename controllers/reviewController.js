import Course from "../models/courseModal.js";
import RatingAndReviews from "../models/ratingAndRewiews.js";

const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rating, review, courseId } = req.body;

    // Check enrollment
    const courseDetails = await Course.findOne({
      _id: courseId,
      enrolledStudents: { $elemMatch: { $eq: userId } },
    });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: "You are not enrolled in this course.",
      });
    }

    // Check duplicate review
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

    // Create new review
    const newReview = await RatingAndReviews.create({
      rating,
      review,
      course: courseId,
      user: userId,
    });

    // Push review ID to course
    await Course.findByIdAndUpdate(
      courseId,
      { $push: { ratingAndReviews: newReview._id } },
      { new: true }
    );

    // Recalculate average rating
    const allReviews = await RatingAndReviews.find({ course: courseId });
    const avgRating =
      allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

    await Course.findByIdAndUpdate(courseId, { averageRating: avgRating });

    return res.status(200).json({
      success: true,
      message: "Rating and review added successfully.",
      data: newReview,
    });
  } catch (error) {
    console.error("Error creating rating:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getReviewsByCourse = async (req, res) => {};
const updateReview = async (req, res) => {};
const deleteReview = async (req, res) => {};

export { createReview, getReviewsByCourse, updateReview, deleteReview };
