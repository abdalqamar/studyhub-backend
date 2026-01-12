import Section from "../models/sectionModal.js";
import Lesson from "../models/lessonModal.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import Course from "../models/courseModal.js";

const createLesson = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { courseId, sectionId } = req.params;
    const videoFile = req.files?.videoFile?.[0] || null;

    if (!courseId || !sectionId || !title || !description || !videoFile) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Validate course and section
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    const sectionExists = await Section.findById(sectionId);
    if (!sectionExists) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found" });
    }

    // Upload video
    const uploadResult = await uploadOnCloudinary(
      videoFile.path,
      process.env.FOLDER_NAME
    );
    if (!uploadResult) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to upload video" });
    }

    const durationInMinutes = uploadResult.duration
      ? parseFloat((uploadResult.duration / 60).toFixed(2))
      : 0;

    // Create lesson
    const lesson = await Lesson.create({
      title,
      description,
      videoUrl: uploadResult.secure_url,
      duration: durationInMinutes,
      publicId: uploadResult.public_id,
    });

    await Section.findByIdAndUpdate(
      sectionId,
      { $push: { lesson: lesson._id } },
      { new: true }
    ).populate("lesson");

    return res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      newLesson: lesson,
      sectionId,
    });
  } catch (error) {
    console.error(" Error creating lesson:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create lesson",
      error: error.message,
    });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { sectionId, lessonId } = req.params;
    const videoFile = req.files?.videoFile?.[0] || null;

    // Validation
    if (!sectionId) {
      return res
        .status(400)
        .json({ success: false, message: "sectionId is required" });
    }

    if (!title && !description && !videoFile) {
      return res
        .status(400)
        .json({ message: "At least one field is required to update" });
    }

    // Find existing lesson
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found" });
    }

    const oldVideoUrl = lesson.videoUrl;
    const updatedData = {};

    if (title) updatedData.title = title;
    if (description) updatedData.description = description;

    // Handle video replacement
    if (videoFile) {
      const maxSize = 200 * 1024 * 1024;
      if (videoFile.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "Video file is too large (max 200MB)",
        });
      }

      const uploadResult = await uploadOnCloudinary(
        videoFile.path,
        process.env.FOLDER_NAME
      );
      if (!uploadResult) {
        return res
          .status(500)
          .json({ success: false, message: "Failed to upload new video" });
      }

      updatedData.videoUrl = uploadResult.secure_url;
      updatedData.duration = uploadResult.duration
        ? parseFloat((uploadResult.duration / 60).toFixed(2))
        : null;
    }

    // Update lesson
    const updatedLesson = await Lesson.findByIdAndUpdate(
      lessonId,
      updatedData,
      {
        new: true,
        runValidators: true,
      }
    );

    // Delete old video from Cloudinary
    if (videoFile && oldVideoUrl) {
      try {
        await deleteFromCloudinary(oldVideoUrl);
      } catch (err) {
        console.error("Old video delete failed:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      updatedLesson,
      sectionId,
      lessonId,
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update lesson",
      error: error.message,
    });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { sectionId, lessonId } = req.params;

    if (!lessonId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "lessonId and sectionId are required",
      });
    }

    // Find lesson
    const lessonExists = await Lesson.findById(lessonId);
    if (!lessonExists) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const oldVideoUrl = lessonExists.videoUrl;

    // Delete video from Cloudinary
    if (oldVideoUrl) {
      try {
        await deleteFromCloudinary(oldVideoUrl);
        console.log("Video deleted from Cloudinary");
      } catch (error) {
        console.error("Failed to delete video from Cloudinary:", error);
      }
    }

    // Remove lesson from section
    await Section.findByIdAndUpdate(sectionId, { $pull: { lesson: lessonId } });

    // Delete lesson from database
    await Lesson.findByIdAndDelete(lessonId);

    // Return only IDs in response
    return res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
      sectionId,
      lessonId,
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting lesson",
      error: error.message,
    });
  }
};

export { createLesson, updateLesson, deleteLesson };
