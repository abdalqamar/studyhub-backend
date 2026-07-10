import mongoose from "mongoose";
import { ILesson } from "../types/lesson.types.js";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
    },
    videoUrl: {
      type: String,
    },
    publicId: {
      type: String,
    },
  },
  { timestamps: true },
);

const Lesson = mongoose.model<ILesson>("Lesson", lessonSchema);
export default Lesson;
