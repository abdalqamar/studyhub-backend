import mongoose from "mongoose";
import RatingAndReviews from "../models/ratingAndReviews.model.js";

export const calculateAverageRating = async (courseId) => {
  const result = await RatingAndReviews.aggregate([
    { $match: { course: new mongoose.Types(courseId) } },
    { $group: { _id: "$course", averageRating: { $avg: "$rating" } } },
  ]);

  return result.length > 0 ? result[0].averageRating.toFixed(1) : 0;
};
