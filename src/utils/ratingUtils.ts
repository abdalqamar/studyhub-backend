import mongoose, { Types } from "mongoose";
import RatingAndReviews from "../models/ratingAndReviews.model.js";

export const calculateAverageRating = async (courseId: string) => {
  const result = await RatingAndReviews.aggregate([
    { $match: { course: new Types.ObjectId(courseId) } },
    { $group: { _id: "$course", averageRating: { $avg: "$rating" } } },
  ]);

  return result.length > 0 ? result[0].averageRating.toFixed(1) : 0;
};
