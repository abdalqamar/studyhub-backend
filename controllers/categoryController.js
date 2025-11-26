import Category from "../models/categoryModal.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const localFile = req.files?.categoryImage?.[0] || null;
    if (!name || !description || !localFile) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const uploadResult = await uploadOnCloudinary(
      localFile.path,
      process.env.FOLDER_NAME
    );
    const category = await Category.create({
      name,
      description,
      image: uploadResult.secure_url,
    });

    return res.status(200).json({
      success: true,
      message: "category created",
      category,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "create category field",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting category",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const { id } = req.params;

    const category = await Category.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error updating category:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const categoriesWithStats = await Category.aggregate([
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "category",
          as: "coursesData",
        },
      },
      {
        $addFields: {
          coursesCount: { $size: "$coursesData" },
          avgRating: {
            $cond: {
              if: { $gt: [{ $size: "$coursesData" }, 0] },
              then: {
                $avg: {
                  $map: {
                    input: "$coursesData",
                    as: "course",
                    in: { $ifNull: ["$$course.ratingAndReviews", 0] },
                  },
                },
              },
              else: 0,
            },
          },
          totalStudents: { $sum: "$coursesData.enrolledStudents" },
        },
      },
      {
        $addFields: {
          students: {
            $cond: {
              if: { $gte: ["$totalStudents", 1000] },
              then: {
                $concat: [
                  {
                    $toString: {
                      $round: [{ $divide: ["$totalStudents", 1000] }, 0],
                    },
                  },
                  "K+",
                ],
              },
              else: { $toString: "$totalStudents" },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          image: 1,
          trending: 1,
          courses: "$coursesCount",
          avgRating: { $round: ["$avgRating", 1] },
          students: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $sort: { trending: -1, createdAt: -1 }, // Trending first, then newest
      },
    ]);

    res.status(200).json({
      success: true,
      count: categoriesWithStats.length,
      categories: categoriesWithStats,
    });
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      category,
      message: "Category fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching category:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching category",
    });
  }
};

export {
  createCategory,
  deleteCategory,
  updateCategory,
  getAllCategories,
  getCategoryById,
};
