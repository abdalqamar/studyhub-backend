import Course from "../models/courseModal.js";
import Section from "../models/sectionModal.js";

const getAllCoursesAdmin = async (req, res) => {
  try {
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const allCourses = await Course.find()
      .populate("category", "name")
      .populate("courseContent")
      .populate("instructor", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    const coursesWithExtras = await Promise.all(
      allCourses.map(async (course) => {
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
      message: "All courses fetched successfully for admin",
      courses: coursesWithExtras,
    });
  } catch (error) {
    console.error("Error fetching all courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch all courses",
      error: error.message,
    });
  }
};

const approveCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndUpdate(
      id,
      { status: "approved", feedback: "" },
      { new: true }
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
      { new: true }
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

const getUserGrowthAnalytics = async (req, res) => {};
const getCoursePerformanceAnalytics = async (req, res) => {};
const getPlatformRevenueAnalytics = async (req, res) => {};
const getEnrollmentTrendsAnalytics = async (req, res) => {};

const getUserAnalytics = async (req, res) => {};
const getCourseAnalytics = async (req, res) => {};
const getRevenueAnalytics = async (req, res) => {};
const getEnrollmentAnalytics = async (req, res) => {};

export { getAllCoursesAdmin, approveCourse, rejectCourse };

// GET /admin/analytics/usersgetUserGrowthAnalyticsGET /admin/analytics/coursesgetCoursePerformanceAnalyticsGET /admin/analytics/revenuegetPlatformRevenueAnalyticsGET /admin/analytics/enrollmentsgetEnrollmentTrendsAnalyticsGET /instructor/analytics/revenuegetInstructorRevenueAnalyticsGET /instructor/analytics/coursesgetInstructorCourseAnalyticsGET /instructor/analytics/studentsgetInstructorStudentAnalytics
