import User from "../models/userModal.js";
import Profile from "../models/profileModal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import CourseProgress from "../models/courseProgressModal.js";
import Course from "../models/courseModal.js";

const updateProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const { firstName, lastName, dateOfBirth, contactNumber, about, gender } =
      req.body;

    if (
      ![firstName, lastName, dateOfBirth, contactNumber, about, gender].some(
        Boolean
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "at least one field is required to update",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (firstName || lastName) {
      user.firstName = firstName;
      user.lastName = lastName;
      await user.save();
    }

    const profileId = user.additionalInformation;
    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      {
        gender,
        dateOfBirth,
        contactNumber,
        about,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "profile updated successful",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: updatedProfile.profileImage,
        gender: updatedProfile.gender,
        dateOfBirth: updatedProfile.dateOfBirth,
        contactNumber: updatedProfile.contactNumber,
        about: updatedProfile.about,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const updateProfileImage = async (req, res) => {
  try {
    const { id } = req.user;

    const image = req.files?.profileImage?.[0] || null;
    console.log(image);
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }
    const uploadResult = await uploadOnCloudinary(
      image.path,
      process.env.FOLDER_NAME
    );

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const profileId = user.additionalInformation;
    const updatedProfile = await Profile.findByIdAndUpdate(
      profileId,
      { profileImage: uploadResult.secure_url },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      updatedProfile,
    });
  } catch (error) {
    console.error("Error updating profileImage:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id)
      .populate("additionalInformation")
      .select("firstName lastName email role ");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const userData = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      gender: user.additionalInformation?.gender || null,
      contactNumber: user.additionalInformation?.contactNumber || null,
      about: user.additionalInformation?.about || null,
      profileImage: user.additionalInformation?.profileImage || null,
      dateOfBirth: user.additionalInformation?.dateOfBirth || null,
    };
    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      user: userData,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).populate("enrolledCourses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const enrolledCourses = user.enrolledCourses;

    // Run all courses in parallel (faster)
    const coursesWithProgress = await Promise.all(
      enrolledCourses.map(async (course) => {
        const fullCourse = await Course.findById(course._id)
          .populate({
            path: "courseContent",
            populate: {
              path: "lesson",
              select: "title duration",
            },
          })
          .populate({
            path: "instructor",
            select: "firstName lastName",
          })
          .populate("category", "name")
          .lean();

        if (!fullCourse) return null;

        const allLessons = fullCourse.courseContent.flatMap(
          (section) => section.lesson || []
        );

        const totalLessons = allLessons.length;

        const totalMinutes = allLessons.reduce(
          (sum, lesson) => sum + (lesson?.duration || 0),
          0
        );

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalDuration = `${hours}h ${minutes}m`;

        const progress = await CourseProgress.findOne({
          userId,
          courseId: course._id,
        });

        const completed = progress?.completedLessons?.length || 0;

        const percentage = totalLessons
          ? Math.round((completed / totalLessons) * 100)
          : 0;

        return {
          _id: course._id,
          thumbnail: course.thumbnail,
          title: course.title,
          description: course.description,
          progressPercentage: percentage,
          totalDuration,
          totalLessons,
          category: fullCourse.category?.name || fullCourse.category,
          instructor: `${fullCourse.instructor?.firstName || ""} ${
            fullCourse.instructor?.lastName || ""
          }`.trim(),
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Enrolled courses fetched successfully",
      courses: coursesWithProgress,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch enrolled courses",
    });
  }
};

export {
  updateProfile,
  updateProfileImage,
  getUserDetails,
  getEnrolledCourses,
};
