import mongoose from "mongoose";

export interface ISection {
  sectionName: string;
  lesson: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
