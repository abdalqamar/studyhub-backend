import Course from "../models/courseModal.js";
import User from "../models/userModal.js";
import Profile from "../models/profileModal.js";
import Payment from "../models/payment.modal.js";

const approveCourse = async (req, res, next) => {
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
    return next(error);
  }
};

const rejectCourse = async (req, res, next) => {
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
    return next(error);
  }
};

const getAdminUsers = async (req, res, next) => {
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
    return next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
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
    return next(error);
  }
};

const deleteUserByAdmin = async (req, res, next) => {
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
    return next(error);
  }
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const [
      totalRevenue,
      totalStudents,
      totalInstructors,
      totalCourses,
      monthlyRevenue,
      topInstructors,
      courseCategories,
      monthlyStudents,
      monthlyInstructors,
      newEnrollments,
    ] = await Promise.all([
      //  Total revenue
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      //  Total students
      User.countDocuments({ role: "student" }),

      //  Total instructors
      User.countDocuments({ role: "instructor" }),

      //  Total courses
      Course.countDocuments(),

      //  Monthly revenue
      Payment.aggregate([
        { $match: { status: "success" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      //  Top instructors by earnings
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: "$instructor", total: { $sum: "$amount" } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "instructor",
          },
        },
        { $unwind: "$instructor" },
        {
          $project: {
            _id: 0,
            instructorId: "$_id",
            name: {
              $concat: ["$instructor.firstName", " ", "$instructor.lastName"],
            },
            earnings: "$total",
          },
        },
      ]),

      // Course categories distribution
      Course.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category.name",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      //  Monthly students growth
      User.aggregate([
        { $match: { role: "student" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      //  Monthly instructors growth
      User.aggregate([
        { $match: { role: "instructor" } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // New enrollments per month
      Payment.aggregate([
        {
          $match: {
            status: "success",
            createdAt: {
              $gte: new Date(2026, 0, 1),
              $lt: new Date(2027, 0, 1),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRevenue: totalRevenue[0]?.total || 0,
          totalStudents,
          totalInstructors,
          totalCourses,
        },
        monthlyRevenue,
        monthlyStudents,
        monthlyInstructors,
        topInstructors,
        courseCategories,
        newEnrollments,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminTransactions = async (req, res, next) => {
  try {
    const {
      status = "all",
      dateRange = "all",
      page = 1,
      limit = 12,
    } = req.query;

    const match = {};

    // status filter
    if (status !== "all") {
      match.status = status;
    }

    // date fillter
    const now = new Date();
    let startDate = null;

    switch (dateRange) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
    }

    if (startDate) {
      match.createdAt = { $gte: startDate };
    }

    const skip = (page - 1) * limit;

    // transactions
    const transactions = await Payment.find(match)
      .populate("user", "firstName lastName")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalCount = await Payment.countDocuments(match);

    // stats
    const statsAgg = await Payment.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ["$status", "success"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRevenue: statsAgg[0]?.totalRevenue || 0,
        },
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export {
  approveCourse,
  rejectCourse,
  getAdminUsers,
  getAdminDashboard,
  updateUserStatus,
  deleteUserByAdmin,
  getAdminTransactions,
};
