import Category from "../models/categoryModal.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const localFile = req.file ? req.file.path : null;

    if (!name || !description || !localFile) {
      return res.status(400).json({
        success: false,
        message: "All fields including image are required",
      });
    }

    const uploadResult = await uploadOnCloudinary(
      localFile,
      process.env.FOLDER_NAME,
    );

    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary upload failed",
      });
    }

    const updatedCategory = await Category.create({
      name,
      description,
      image: uploadResult.secure_url,
    });

    return res.status(200).json({
      success: true,
      message: "Category created",
      updatedCategory,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteCategory = async (req, res, next) => {
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
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const localFile = req.file ? req.file.path : null;

    // Check if at least one field is provided
    if (!name && !description && !localFile && req.body.image !== "") {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update",
      });
    }

    // Find existing category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const updateData = {};

    // Name
    if (name) updateData.name = name;

    // Description
    if (description) updateData.description = description;

    // Image handling
    const shouldRemoveImage = req.body.image === "";

    if (shouldRemoveImage && category.image) {
      await deleteFromCloudinary(category.image);
      updateData.image = "";
    } else if (localFile) {
      const uploadResult = await uploadOnCloudinary(
        localFile,
        process.env.FOLDER_NAME,
      );

      if (!uploadResult || !uploadResult.secure_url) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }

      // Delete old image if it exists
      if (category.image) {
        await deleteFromCloudinary(category.image);
      }

      updateData.image = uploadResult.secure_url;
    }

    // Update only the fields present in updateData
    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      updatedCategory,
    });
  } catch (error) {
    return next(error);
  }
};

const getAllCategories = async (req, res, next) => {
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
        $sort: { trending: -1, createdAt: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: categoriesWithStats.length,
      categories: categoriesWithStats,
    });
  } catch (error) {
    return next(error);
  }
};

const getCategoryById = async (req, res, next) => {
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
    return next(error);
  }
};

export {
  createCategory,
  deleteCategory,
  updateCategory,
  getAllCategories,
  getCategoryById,
};
