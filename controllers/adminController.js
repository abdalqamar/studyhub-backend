import Course from "../models/courseModal.js";
import Section from "../models/sectionModal.js";
import User from "../models/userModal.js";
import Profile from "../models/profileModal.js";

const approveCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndUpdate(
      id,
      { status: "approved", feedback: "" },
      { new: true },
    );

    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    res.status(200).json({
      success: true,
      message: "Course approved successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approving course",
    });
  }
};

const rejectCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    const course = await Course.findByIdAndUpdate(
      id,
      { status: "rejected", feedback },
      { new: true },
    );

    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    res.status(200).json({
      success: true,
      message: "Course rejected with feedback",
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting course",
    });
  }
};

const getAdminUsers = async (req, res) => {
  try {
    const { role, search, status, page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const matchQuery = {};

    // Filters
    if (role) matchQuery.role = role;
    if (status) matchQuery.status = status;

    if (search) {
      matchQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role === "instructor") {
      const users = await User.aggregate([
        { $match: matchQuery },

        {
          $lookup: {
            from: "profiles",
            localField: "additionalInformation",
            foreignField: "_id",
            as: "profile",
          },
        },
        {
          $unwind: {
            path: "$profile",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Courses created
        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "instructor",
            as: "courses",
          },
        },

        {
          $addFields: {
            coursesCreated: { $size: "$courses" },
            totalStudents: {
              $sum: {
                $map: {
                  input: "$courses",
                  as: "course",
                  in: {
                    $size: {
                      $ifNull: ["$$course.enrolledStudents", []],
                    },
                  },
                },
              },
            },
          },
        },

        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            role: 1,
            status: 1,
            lastActive: 1,
            createdAt: 1,
            coursesCreated: 1,
            totalStudents: 1,
            profileImage: "$profile.profileImage",
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) },
      ]);

      const total = await User.countDocuments(matchQuery);

      return res.status(200).json({
        success: true,
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    }

    const [users, total] = await Promise.all([
      User.find(matchQuery)
        .select(
          "firstName lastName email role status lastActive createdAt enrolledCourses additionalInformation",
        )
        .populate("additionalInformation", "profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(matchQuery),
    ]);

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      lastActive: user.lastActive,
      createdAt: user.createdAt,
      coursesEnrolled: user.enrolledCourses?.length || 0,
      profileImage: user.additionalInformation?.profileImage || null,
    }));

    return res.status(200).json({
      success: true,
      users: formattedUsers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user status",
    });
  }
};

const deleteUserByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    //  find user
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // prevent self delete
    if (req.user.id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "Admin cannot delete himself",
      });
    }

    // delete profile
    if (user.additionalInformation) {
      await Profile.findByIdAndDelete(user.additionalInformation);
    }

    //  remove user from enrolled courses
    if (user.enrolledCourses?.length > 0) {
      await Course.updateMany(
        { _id: { $in: user.enrolledCourses } },
        { $pull: { enrolledStudents: user._id } },
      );
    }

    //  delete user
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

const getUserGrowthAnalytics = async (req, res) => {};
const getCoursePerformanceAnalytics = async (req, res) => {};
const getPlatformRevenueAnalytics = async (req, res) => {};
const getEnrollmentTrendsAnalytics = async (req, res) => {};

const getUserAnalytics = async (req, res) => {};
const getCourseAnalytics = async (req, res) => {};
const getRevenueAnalytics = async (req, res) => {};
const getEnrollmentAnalytics = async (req, res) => {};

export {
  approveCourse,
  rejectCourse,
  getAdminUsers,
  getUserGrowthAnalytics,
  getCoursePerformanceAnalytics,
  getPlatformRevenueAnalytics,
  getEnrollmentTrendsAnalytics,
  getUserAnalytics,
  getCourseAnalytics,
  getRevenueAnalytics,
  getEnrollmentAnalytics,
  updateUserStatus,
  deleteUserByAdmin,
};
