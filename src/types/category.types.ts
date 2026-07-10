import mongoose from "mongoose";

export interface ICategory {
  name: string;
  description: string;
  image: string;
  imagePublicId: string;
  trending: boolean;
  courses: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDTO {
  name: string;
  description: string;
}

export interface UpdateCategoryDTO {
  name?: string;
  description?: string;
  removeImage?: boolean;
}
