import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    questionType: {
      type: String,
      enum: ["multiple-choice", "true-false", "short-answer", "essay"],
      required: true,
    },
    options: [
      {
        optionText: {
          type: String,
          required: true,
          trim: true,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],
    correctAnswer: {
      type: String,
      trim: true,
    },
    marks: {
      type: Number,
      required: true,
      min: 1,
    },
    explanation: {
      type: String,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Validation for multiple choice questions
questionSchema.pre("save", function (next) {
  if (this.questionType === "multiple-choice") {
    if (!this.options || this.options.length < 2) {
      return next(
        new Error("Multiple choice questions must have at least 2 options")
      );
    }
    const correctOptions = this.options.filter((opt) => opt.isCorrect);
    if (correctOptions.length === 0) {
      return next(new Error("At least one option must be marked as correct"));
    }
  }
  next();
});

const Question = mongoose.model("Question", questionSchema);
export default Question;
