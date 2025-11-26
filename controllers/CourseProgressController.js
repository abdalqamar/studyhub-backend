import CourseProgress from "../models/courseProgressModal.js";

const markComplete = async (req, res) => {
  const { courseId, lessonId } = req.body;
  const userId = req.user.id;

  let progress = await CourseProgress.findOne({ userId, courseId });

  if (!progress.completedVideos.includes(lessonId)) {
    progress.completedVideos.push(lessonId);
  }

  progress.progressPercentage =
    (progress.completedVideos.length / progress.totalVideos) * 100;

  await progress.save();

  res.status(200).json({
    success: true,
    message: "Lecture marked complete",
    progress,
  });
};

export { markComplete };
