import Category from "../models/categoryModal.js";
import Course from "../models/courseModal.js";
import Lesson from "../models/lessonModal.js";
import Section from "../models/sectionModal.js";
import User from "../models/userModal.js";
import CourseProgress from "../models/courseProgressModal.js";

import mongoose from "mongoose";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const createCourse = async (req, res) => {
  try {
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only instructors or admins can create a course",
      });
    }
    const {
      title,
      description,
      price,
      category,
      status,
      whatYouWillLearn,
      tags,
      requirements,
      instructions,
    } = req.body;

    if (
      !title?.trim() ||
      !description?.trim() ||
      !whatYouWillLearn ||
      !price ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "All Fields are Mandatory",
      });
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid non-negative number",
      });
    }

    // Validate category
    const isCategory = await Category.findById(category);
    if (!isCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
    const localFile = req.files?.courseThumbnail?.[0] || null;

    if (!localFile) {
      return res.status(400).json({
        success: false,
        message: "Thumbnail image is required",
      });
    }
    let thumbnailUrl = null;
    let publicId = null;
    const uploadResult = await uploadOnCloudinary(
      localFile.path,
      process.env.FOLDER_NAME
    );

    thumbnailUrl = uploadResult.secure_url;
    publicId = uploadResult.public_id;

    // Create new course
    const newCourse = await Course.create({
      title,
      description,
      instructor: req.user.id,
      price: parsedPrice,
      thumbnail: thumbnailUrl,
      thumbnailPublicId: publicId,
      category: isCategory._id,
      status,
      tags: Array.isArray(tags) ? tags : [tags],
      whatYouWillLearn: Array.isArray(whatYouWillLearn)
        ? whatYouWillLearn
        : [whatYouWillLearn],
      requirements,
      instructions,
    });

    // Add course to instructor's courses array
    await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: { enrolledCourses: newCourse._id },
      },
      { new: true }
    );

    // Add course to category's courses array
    await Category.findByIdAndUpdate(
      category,
      { $push: { courses: newCourse._id } },
      { new: true }
    );

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: newCourse,
    });
  } catch (error) {
    console.error("Course creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Course creation failed",
      error: error.message,
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Course Id is required" });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Delete thumbnail from Cloudinary
    const thumbnailUrl = course.thumbnail;
    if (thumbnailUrl) {
      try {
        await deleteFromCloudinary(thumbnailUrl);
      } catch (err) {
        console.error("Thumbnail delete failed:", err.message);
      }
    }

    // Remove from enrolled students
    for (const userId of course.enrolledStudents) {
      await User.findByIdAndUpdate(userId, { $pull: { enrolledCourses: id } });
    }

    // Delete sections & lessons
    for (const sectionId of course.courseContent) {
      const section = await Section.findById(sectionId);
      if (section) {
        await Lesson.deleteMany({ section: sectionId });
        await Section.findByIdAndDelete(sectionId);
      }
    }

    // Delete course
    await Course.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Error deleting course:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllCourses = async (_, res) => {
  try {
    const courses = await Course.find({ status: "approved" })
      .populate("category", "name")
      .populate("instructor", "firstName lastName")
      .populate({
        path: "courseContent",
        populate: {
          path: "lesson",
          select: "duration",
        },
      })
      .lean();

    if (!courses.length) {
      return res.status(200).json({
        success: true,
        message: "No approved courses found",
        courses: [],
      });
    }

    const formattedCourses = courses.map((course) => {
      const lessons = course.courseContent.flatMap((sec) => sec.lesson || []);

      const totalMinutes = lessons.reduce(
        (sum, l) => sum + (l.duration || 0),
        0
      );

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        price: course.price,
        discountPrice: course.discountPrice ?? null,
        averageRating: course.averageRating || 0,
        category: course.category?.name || null,
        instructor: `${course.instructor?.firstName || ""} ${
          course.instructor?.lastName || ""
        }`.trim(),

        totalLectures: lessons.length,
        totalDuration: `${hours}h ${minutes}m`,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Approved courses fetched successfully",
      courses: formattedCourses,
    });
  } catch (error) {
    console.error("Error getting courses:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved courses",
    });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).json({
        success: false,
        message: "course not found",
      });
    }

    // Return populated course
    const populatedCourse = await Course.findById(id)
      .populate("instructor", "firstName lastName")
      .populate({
        path: "courseContent",
        populate: {
          path: "lesson",
        },
      })
      .populate("ratingAndReviews")
      .populate("enrolledStudents")
      .populate("category", "name");

    return res.status(200).json({
      success: true,
      message: "Course details get succesfully",
      course: populatedCourse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

const getInstructorCourses = async (req, res) => {
  try {
    const { id } = req.user;

    const myCourses = await Course.find({ instructor: id })
      .populate("category", "name")
      .populate("courseContent")
      .populate("instructor", "firstName lastName")
      .sort({ createdAt: -1 })
      .lean();

    const coursesWithExtras = await Promise.all(
      myCourses.map(async (course) => {
        const sectionIds = course.courseContent.map((sec) => sec._id);

        const sections = await Section.find({
          _id: { $in: sectionIds },
        }).populate("lesson", "duration");

        const allLessons = sections.flatMap((sec) => sec.lesson);

        const totalMinutes = allLessons.reduce(
          (acc, lesson) => acc + (lesson?.duration || 0),
          0
        );

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return {
          ...course,
          enrolledCount: course.enrolledStudents?.length || 0,
          averageRating: course.averageRating || 0,
          duration: `${hours}h ${minutes}m`,
        };
      })
    );
    res.status(200).json({
      success: true,
      message: "all courses fetched by instructor",
      courses: coursesWithExtras,
    });
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your courses",
    });
  }
};

// Helper to prepare updates
function prepareUpdates(body, thumbnailUrl) {
  const updates = {};

  // String fields
  const stringFields = ["title", "description", "requirements"];
  stringFields.forEach((f) => {
    if (body[f]?.trim()) updates[f] = body[f].trim();
  });

  // Instructions → array
  if (body.instructions?.trim()) {
    updates.instructions = body.instructions
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);
  }

  // Array fields (tags, whatYouWillLearn)
  ["tags", "whatYouWillLearn"].forEach((f) => {
    if (!body[f]) return;
    if (typeof body[f] === "string") {
      updates[f] = body[f]
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);
    } else if (Array.isArray(body[f])) {
      updates[f] = body[f].map((i) => i.trim()).filter(Boolean);
    }
  });

  // Price
  if (body.price !== undefined) {
    const p = Number(body.price);
    if (!isNaN(p) && p >= 0) updates.price = p;
  }

  // Thumbnail (only URL)
  if (thumbnailUrl) updates.thumbnail = thumbnailUrl;

  // Category
  if (body.category) updates.category = body.category;

  // Status
  const valid = ["draft", "pending", "approved", "rejected"];
  if (body.status && valid.includes(body.status)) updates.status = body.status;

  return updates;
}

const getCoursePreview = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate("category", "name")
      .populate({
        path: "instructor",
        select: "firstName lastName email",
        populate: {
          path: "additionalInformation",
          select: "about profileImage",
        },
      })
      .populate({
        path: "courseContent",
        populate: {
          path: "lesson",
          select: "title description duration videoUrl",
        },
      })
      .populate({
        path: "ratingAndReviews",
        populate: {
          path: "user",
          select: "firstName lastName email additionalInformation",
          populate: {
            path: "additionalInformation",
            select: "profileImage",
          },
        },
      })
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Extract lessons
    const allLessons = course.courseContent.flatMap(
      (section) => section.lesson || []
    );

    // Total duration
    const totalMinutes = allLessons.reduce(
      (sum, lesson) => sum + (lesson?.duration || 0),
      0
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    // Ratings
    const ratings = course.ratingAndReviews || [];
    const totalRating = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = ratings.length
      ? Number((totalRating / ratings.length).toFixed(1))
      : 0;

    // Reviews formatting
    const formattedReviews = ratings.map((r) => ({
      _id: r._id,
      rating: r.rating,
      review: r.review,
      user: r.user
        ? {
            _id: r.user._id,
            name: `${r.user.firstName} ${r.user.lastName}`,
            email: r.user.email,
            profileImage: r.user.additionalInformation?.profileImage || null,
          }
        : null,
    }));

    // Final Response
    return res.status(200).json({
      success: true,
      message: "Course preview fetched successfully",
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        whatYouWillLearn: course.whatYouWillLearn,
        requirements: course.requirements,
        category: course.category,
        price: course.price,
        thumbnail: course.thumbnail,
        averageRating,
        totalStudents: course.enrolledStudents?.length || 0,
        totalLectures: allLessons.length,
        totalDuration: `${hours}h ${minutes}m`,
        status: course.status,
        createdAt: course.createdAt,
        instructor: course.instructor,
        curriculum: course.courseContent,
        reviews: formattedReviews,
      },
    });
  } catch (error) {
    console.error("Error in getCoursePreview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course preview",
      error: error.message,
    });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate("category", "name")
      .populate({
        path: "instructor",
        select: "firstName lastName email",
        populate: {
          path: "additionalInformation",
          select: "about profileImage",
        },
      })
      .populate({
        path: "courseContent",
        populate: {
          path: "lesson",
          select: "title description duration",
        },
      })
      .populate({
        path: "ratingAndReviews",
        populate: {
          path: "user",
          select: "firstName lastName email additionalInformation",
          populate: {
            path: "additionalInformation",
            select: "profileImage",
          },
        },
      })
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Extract lessons
    const allLessons = course.courseContent.flatMap(
      (section) => section.lesson || []
    );

    // Total duration
    const totalMinutes = allLessons.reduce(
      (sum, lesson) => sum + (lesson?.duration || 0),
      0
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    // Ratings
    const ratings = course.ratingAndReviews || [];
    const totalRating = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = ratings.length
      ? Number((totalRating / ratings.length).toFixed(1))
      : 0;

    // Reviews formatting
    const formattedReviews = ratings.map((r) => ({
      _id: r._id,
      rating: r.rating,
      review: r.review,
      user: r.user
        ? {
            _id: r.user._id,
            name: `${r.user.firstName} ${r.user.lastName}`,
            email: r.user.email,
            profileImage: r.user.additionalInformation?.profileImage || null,
          }
        : null,
    }));

    // Final Response
    return res.status(200).json({
      success: true,
      message: "Course details fetched successfully",
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        whatYouWillLearn: course.whatYouWillLearn,
        requirements: course.requirements,
        category: course.category,
        price: course.price,
        thumbnail: course.thumbnail,
        averageRating,
        totalStudents: course.enrolledStudents?.length || 0,
        totalLectures: allLessons.length,
        totalDuration: `${hours}h ${minutes}m`,
        instructor: course.instructor,
        curriculum: course.courseContent,
        reviews: formattedReviews,
      },
    });
  } catch (error) {
    console.error("Error in getCourseDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course details",
      error: error.message,
    });
  }
};

const getCourseContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(id)
      .populate({
        path: "courseContent",
        populate: {
          path: "lesson",
          select: "title description duration videoUrl",
        },
      })
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const allLessons = course.courseContent.flatMap(
      (section) => section.lesson || []
    );

    const totalLessons = allLessons.length;

    let progress = await CourseProgress.findOne({
      userId,
      id,
    });

    const completedLessons = progress?.completedLessons || [];

    const completedSet = new Set(completedLessons.map(String));

    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : 0;

    const courseContentWithCompletion = course.courseContent.map((section) => ({
      ...section,
      lesson: section.lesson.map((lsn) => ({
        ...lsn,
        isCompleted: completedSet.has(lsn._id.toString()),
      })),
    }));

    return res.status(200).json({
      success: true,
      message: "Course content fetched successfully",
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        courseContent: courseContentWithCompletion,
        completedLessons,
        progressPercentage,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get course content",
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID" });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Authorisation
    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to update this course",
      });
    }

    // Auto-reset status if rejected
    if (course.status === "rejected") {
      req.body.status = "pending";
      req.body.feedback = "";
    }

    // Thumbnail file
    const localFile = req.files?.courseThumbnail?.[0] || null;
    const oldThumbnailUrl = course.thumbnail; // secure_url only

    let thumbnailUrl = null;

    if (localFile) {
      const uploadResult = await uploadOnCloudinary(
        localFile.path,
        process.env.FOLDER_NAME
      );
      if (uploadResult) thumbnailUrl = uploadResult.secure_url;
    }

    // Build updates
    const updates = prepareUpdates(req.body, thumbnailUrl);

    // Validate category if changing
    if (updates.category && updates.category !== course.category.toString()) {
      const cat = await Category.findById(updates.category);
      if (!cat) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }
    }

    // Apply updates
    Object.assign(course, updates);
    await course.save();

    // Delete old thumbnail (URL-based, same as category)
    if (localFile && oldThumbnailUrl) {
      try {
        await deleteFromCloudinary(oldThumbnailUrl);
      } catch (err) {
        console.error("Old thumbnail delete failed:", err.message);
      }
    }

    // Return populated course
    const populatedCourse = await Course.findById(id)
      .populate("instructor", "firstName lastName")
      .populate({ path: "courseContent", populate: { path: "lesson" } })
      .populate("category", "name");

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: populatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
export {
  createCourse,
  deleteCourse,
  updateCourse,
  getAllCourses,
  getCourseById,
  getCourseDetails,
  getInstructorCourses,
  getCoursePreview,
  getCourseContent,
};
