import User from "../models/userModal.js";

// Get all users (Admin only)

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findById({}).populate(
      "fullName",
      "email",
      "enrolledCourses".populate({
        path: "courseContent",
        populate: {
          path: "course",
          path: "courseName",
        },
      })
    );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "server error while fetching all users",
      error: error.message,
    });
  }
};
// Get user by ID
// Update user info
// Delete user (Admin only)
