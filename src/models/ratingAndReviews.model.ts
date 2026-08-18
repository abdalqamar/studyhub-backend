import mongoose from "mongoose";
import { IRating } from "../types/rating.types.js";

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
const RatingAndReviews = mongoose.model<IRating>(
  "RatingAndReviews",
  ratingAndReviewsScheema,
);
export default RatingAndReviews;
