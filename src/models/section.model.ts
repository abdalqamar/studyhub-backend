import mongoose from "mongoose";
import { ISection } from "../types/section.types.js";

const sectionSchema = new mongoose.Schema(
  {
    sectionName: {
      type: String,
      required: true,
    },
    lesson: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
  },
  { timestamps: true },
);

const Section = mongoose.model<ISection>("Section", sectionSchema);
export default Section;
