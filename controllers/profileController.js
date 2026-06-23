import User from "../models/userModal.js";
import Profile from "../models/profileModal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import CourseProgress from "../models/courseProgressModal.js";
import Course from "../models/courseModal.js";

const updateProfile = async (req, res, next) => {
  try {
    const id = req.user.id;

    const { firstName, lastName, dateOfBirth, contactNumber, about, gender } =
      req.body;

    // At least one field is required to update
    if (
      ![firstName, lastName, dateOfBirth, contactNumber, about, gender].some(
        Boolean,
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
      { new: true },
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
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfileImage = async (req, res, next) => {
  try {
    const { id } = req.user;

    const image = req.files?.profileImage?.[0] || null;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
    }
    const uploadResult = await uploadOnCloudinary(
      image.path,
      process.env.FOLDER_NAME,
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
      { new: true },
    );
    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      updatedProfile,
    });
  } catch (error) {
    return next(error);
  }
};

// Get user details for there profile
const getUserDetails = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id)
      .populate("additionalInformation")
      .select("firstName lastName email role lastActive ");
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
      lastActive: user.lastActive,
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
    return next(error);
  }
};

// For getting enrolled courses of user
const getEnrolledCourses = async (req, res, next) => {
  const userId = req.user?.id;

  // Ek query mein sab lo
  const user = await User.findById(userId)
    .populate({
      path: "enrolledCourses",
      populate: [
        {
          path: "courseContent",
          populate: { path: "lesson", select: "title duration" },
        },
        { path: "instructor", select: "firstName lastName" },
        { path: "category", select: "name" },
      ],
    })
    .lean();

  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  const courseIds = user.enrolledCourses.map((c) => c._id);

  // Ek query mein sab progress
  const allProgress = await CourseProgress.find({
    userId,
    courseId: { $in: courseIds },
  }).lean();

  const progressMap = {};
  allProgress.forEach((p) => {
    progressMap[p.courseId.toString()] = p;
  });

  const coursesWithProgress = user.enrolledCourses.map((course) => {
    const allLessons = course.courseContent.flatMap((s) => s.lesson || []);
    const totalLessons = allLessons.length;
    const totalMinutes = allLessons.reduce(
      (sum, l) => sum + (l.duration || 0),
      0,
    );
    const progress = progressMap[course._id.toString()];
    const completed = progress?.completedLessons?.length || 0;

    return {
      _id: course._id,
      title: course.title,
      thumbnail: course.thumbnail,
      progressPercentage: totalLessons
        ? Math.round((completed / totalLessons) * 100)
        : 0,
      totalDuration: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      totalLessons,
      category: course.category?.name || null,
      instructor:
        `${course.instructor?.firstName || ""} ${course.instructor?.lastName || ""}`.trim(),
    };
  });

  return res.status(200).json({ success: true, courses: coursesWithProgress });
};
export {
  updateProfile,
  updateProfileImage,
  getUserDetails,
  getEnrolledCourses,
};
