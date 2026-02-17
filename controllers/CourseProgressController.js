import CourseProgress from "../models/courseProgressModal.js";

const markComplete = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.body;
    const userId = req.user.id;

    const progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "Course progress not found",
      });
    }

    if (!progress.completedVideos.includes(lessonId)) {
      progress.completedVideos.push(lessonId);
    }

    progress.progressPercentage =
      (progress.completedVideos.length / progress.totalVideos) * 100;

    await progress.save();

    return res.status(200).json({
      success: true,
      message: "Lecture marked complete",
      progress,
    });
  } catch (error) {
    return next(error);
  }
};

export { markComplete };
