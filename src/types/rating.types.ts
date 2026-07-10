import mongoose from "mongoose";

export interface IRating {
  course: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PopulatedRating = {
  _id: mongoose.Types.ObjectId;
  rating: number;
  review: string;
  createdAt: Date;
  user: {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    email: string;
    lastName: string;
    additionalInformation?: { profileImage?: string };
  };
};
