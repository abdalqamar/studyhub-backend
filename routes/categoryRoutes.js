import express from "express";
import upload from "../utils/multer.js";
import { isAdmin, isAuthenticated } from "../middleware/authMiddleware.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getAllCategories);
router.get("/:id", getCategoryById);
router.post(
  "/",
  isAuthenticated,
  isAdmin,
  upload.single("image"),
  createCategory
);
router.put(
  "/:id",
  isAuthenticated,
  isAdmin,
  upload.single("image"),
  updateCategory
);

router.delete("/:id", isAuthenticated, isAdmin, deleteCategory);
export default router;
