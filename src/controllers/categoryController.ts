import Category from "../models/categoryModal.js";
import { Request, Response, NextFunction } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import * as categoryService from "../services/categoryService.js";
import { AppError } from "../utils/AppError.js";

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return next(new AppError(400, "Category image is required"));
    }
    const imageFile = req.file;

    const category = await categoryService.createCategory(req.body, imageFile);
    return sendSuccess(res, 201, "Category created successfully", { category });
  } catch (error) {
    return next(error);
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const imageFile = req.file || null;
    const removeImage = req.body.image === "";
    const category = await categoryService.updateCategory(
      req.params.id as string,
      { ...req.body, removeImage },
      imageFile,
    );
    return sendSuccess(res, 200, "Category updated successfully", { category });
  } catch (error) {
    return next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await categoryService.deleteCategory(req.params.id as string);
    return sendSuccess(res, 200, "Category deleted successfully");
  } catch (error) {
    return next(error);
  }
};

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await Category.aggregate([
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
          totalStudents: { $sum: "$coursesData.totalStudentsCount" },
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
          students: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { trending: -1, createdAt: -1 } },
    ]);

    return sendSuccess(res, 200, "Categories fetched", {
      count: categories.length,
      categories,
    });
  } catch (error) {
    return next(error);
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return sendError(res, 404, "Category not found");
    return sendSuccess(res, 200, "Category fetched successfully", { category });
  } catch (error) {
    return next(error);
  }
};
