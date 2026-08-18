import mongoose from "mongoose";
import { ICategory } from "../types/category.types.js";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    imagePublicId: {
      type: String,
      default: "",
    },
    trending: {
      type: Boolean,
      default: false,
    },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true },
);

categorySchema.index({ name: 1 });

const Category = mongoose.model<ICategory>("Category", categorySchema);
export default Category;
