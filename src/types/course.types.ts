import mongoose from "mongoose";

export interface ICourse {
  title: string;
  description: string;
  instructor: mongoose.Types.ObjectId;
  whatYouWillLearn: string[];
  courseContent: mongoose.Types.ObjectId[];
  ratingAndReviews: mongoose.Types.ObjectId[];
  price: number;
  thumbnail: string;
  thumbnailPublicId: string;
  instructions: string[];
  tags: string[];
  requirements: string[];
  enrolledStudents: mongoose.Types.ObjectId[];
  status: "draft" | "pending" | "approved" | "rejected";
  category: mongoose.Types.ObjectId;
  feedback: string;
  averageRating: number;
  totalLessons: number;
  totalDuration: string;
  totalStudentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCourseDTO {
  title: string;
  description: string;
  price: string | number;
  category?: string;
  status?: "draft" | "pending" | "approved" | "rejected";
  whatYouWillLearn: string | string[];
  tags?: string | string[];
  requirements?: string[];
  instructions?: string;
}

export interface UpdateCourseDTO {
  title?: string;
  description?: string;
  price?: string | number;
  category?: string;
  status?: "draft" | "pending" | "approved" | "rejected";
  whatYouWillLearn?: string | string[];
  tags?: string | string[];
  requirements?: string[];
  instructions?: string;
}
