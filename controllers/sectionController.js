import Section from "../models/sectionModal.js";
import Course from "../models/courseModal.js";
import Lesson from "../models/lessonModal.js";

const createSection = async (req, res) => {
  try {
    const { sectionName } = req.body;
    const { courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId required",
      });
    }
    if (!sectionName) {
      return res.status(400).json({
        success: false,
        message: "sectionName required",
      });
    }

    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (
      courseExists.status === "rejected" ||
      courseExists.status === "approved"
    ) {
      courseExists.status = "pending";
      courseExists.feedback = "";
      await courseExists.save();
    }

    // Create new section
    const section = await Section.create({ sectionName });

    await Course.findByIdAndUpdate(courseId, {
      $push: { courseContent: section._id },
    });

    // Sirf new section return karo
    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      newSection: section,
    });
  } catch (error) {
    console.error("Error creating section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create section",
      error: error.message,
    });
  }
};

const updateSection = async (req, res) => {
  try {
    console.log(req.params, req.body);
    const { sectionName } = req.body;
    const { sectionId, courseId } = req.params;

    if (!sectionId || !sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "sectionId, sectionName, and courseId are required",
      });
    }

    // Check if course exists
    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Update the section name
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true },
    ).populate("lesson");

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Section updated successfully",
      updatedSection,
    });
  } catch (error) {
    console.error("Error updating section:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating section",
      error: error.message,
    });
  }
};

const deleteSection = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;

    if (!sectionId || !courseId) {
      return res.status(400).json({
        success: false,
        message: "sectionId and courseId are required",
      });
    }

    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Delete all lessons in this section
    if (section.lesson && section.lesson.length > 0) {
      await Lesson.deleteMany({ _id: { $in: section.lesson } });
    }

    // Remove section from course
    await Course.findByIdAndUpdate(courseId, {
      $pull: { courseContent: sectionId },
    });

    // Delete the section - CORRECT SYNTAX
    await Section.findByIdAndDelete(sectionId);

    return res.status(200).json({
      success: true,
      message: "Section deleted successfully",
      sectionId,
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting section",
      error: error.message,
    });
  }
};

export { createSection, updateSection, deleteSection };
