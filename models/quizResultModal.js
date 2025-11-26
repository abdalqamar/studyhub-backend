import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.ObjectId,
      ref: "Quiz",
      required: true,
    },
    student: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    attempts: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "QuizAttempt",
      },
    ],
    bestScore: {
      type: Number,
      default: 0,
    },
    bestPercentage: {
      type: Number,
      default: 0,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    averageScore: {
      type: Number,
      default: 0,
    },
    timeSpentTotal: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

quizAttemptSchema.post("save", async function (doc, next) {
  try {
    // Student ke liye ek quiz result dhoondo
    let result = await QuizResult.findOne({
      quiz: doc.quiz,
      student: doc.student,
    });

    if (!result) {
      // Agar pehli baar hai to naya result banao
      result = new QuizResult({
        quiz: doc.quiz,
        student: doc.student,
        attempts: [doc._id],
        bestScore: doc.score,
        totalAttempts: 1,
        isPassed: doc.isPassed,
        averageScore: doc.score,
        timeSpentTotal: doc.timeSpent,
      });
    } else {
      // Agar result pehle se hai to update karo
      result.attempts.push(doc._id);
      result.totalAttempts = result.attempts.length;
      result.bestScore = Math.max(result.bestScore, doc.score);
      result.averageScore =
        (result.averageScore * (result.totalAttempts - 1) + doc.score) /
        result.totalAttempts;
      result.timeSpentTotal += doc.timeSpent;
      result.isPassed = result.isPassed || doc.isPassed;
    }

    await result.save();
    next();
  } catch (err) {
    next(err);
  }
});
const QuizResult = mongoose.model("QuizResult", quizResultSchema);
export default QuizResult;
