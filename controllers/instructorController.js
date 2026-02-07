import Course from "../models/courseModal.js";
import User from "../models/userModal.js";

const getInstructorUsers = async (req, res) => {
  try {
    const { id } = req.user;
    const { search, status, page = 1, limit = 12 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const instructorCourses = await Course.find({ instructor: id }, { _id: 1 });

    const courseIds = instructorCourses.map((course) => course._id);

    // agar instructor ke courses hi nahi
    if (!courseIds.length) {
      return res.status(200).json({
        success: true,
        users: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          totalPages: 0,
        },
      });
    }

    const matchQuery = {
      role: "student",
      enrolledCourses: { $in: courseIds },
    };

    if (status) matchQuery.status = status;

    if (search) {
      matchQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(matchQuery)
        .select(
          "firstName lastName email status lastActive createdAt enrolledCourses additionalInformation",
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
      createdAt: user.createdAt,
      status: user.status,
      lastActive: user.lastActive,
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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch instructor students",
    });
  }
};

export { getInstructorUsers };
