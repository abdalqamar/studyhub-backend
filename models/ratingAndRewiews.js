import mongoose from "mongoose";

const ratingAndReviewsScheema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    review: {
      type: String,
    },
  },
  { timestamps: true },
);
const RatingAndReviews = mongoose.model(
  "RatingAndReviews",
  ratingAndReviewsScheema,
);
export default RatingAndReviews;
