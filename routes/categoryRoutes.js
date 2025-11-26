import express from "express";
import upload from "../utils/multer.js";
import { isAdmin, isAuthenticated } from "../middleware/authMiddleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:categoryId", getCategoryById);
router.post(
  "/",
  upload.fields([{ name: "categoryImage", maxCount: 1 }]),
  isAuthenticated,
  isAdmin,
  createCategory
);
router.put(
  "/:categoryId",
  upload.fields([{ name: "categoryImage", maxCount: 1 }]),
  isAuthenticated,
  isAdmin,
  createCategory
);

router.delete("/:categoryId", isAuthenticated, isAdmin, deleteCategory);
export default router;
