import Category from "../models/category.model.js";
import {
  uploadWithRollback,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import {
  CreateCategoryDTO,
  ICategory,
  UpdateCategoryDTO,
} from "../types/category.types.js";

export const createCategory = async (
  { name, description }: CreateCategoryDTO,
  imageFile: Express.Multer.File,
) => {
  if (!name?.trim() || !description?.trim()) {
    throw new AppError(400, "Name and description are required");
  }
  if (!imageFile) throw new AppError(400, "Category image is required");

  const { uploadResult, rollback } = await uploadWithRollback(imageFile.path);

  let category;
  try {
    category = await Category.create({
      name: name.trim(),
      description: description.trim(),
      image: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
    });
  } catch (dbErr) {
    await rollback();
    throw dbErr;
  }

  return category;
};

export const updateCategory = async (
  id: string,
  { name, description, removeImage }: UpdateCategoryDTO,
  imageFile: Express.Multer.File | null,
) => {
  const category = await Category.findById(id);
  if (!category) throw new AppError(404, "Category not found");

  const updates: Partial<ICategory> = {};
  if (name?.trim()) updates.name = name.trim();
  if (description?.trim()) updates.description = description.trim();

  if (removeImage && category.image) {
    await deleteFromCloudinary(category.image, category.imagePublicId).catch(
      () => null,
    );
    updates.image = "";
    updates.imagePublicId = "";
  } else if (imageFile) {
    const oldUrl = category.image;
    const oldPublicId = category.imagePublicId;

    const { uploadResult, rollback } = await uploadWithRollback(imageFile.path);

    try {
      updates.image = uploadResult.secure_url;
      updates.imagePublicId = uploadResult.public_id;

      const updated = await Category.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      // Delete old image only after successful save
      if (oldUrl) deleteFromCloudinary(oldUrl, oldPublicId).catch(() => null);

      return updated;
    } catch (saveErr) {
      await rollback();
      throw saveErr;
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError(400, "At least one field is required to update");
  }

  return Category.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });
};

export const deleteCategory = async (id: string) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new AppError(404, "Category not found");

  // Best-effort image cleanup
  if (category.image) {
    deleteFromCloudinary(category.image, category.imagePublicId).catch(
      () => null,
    );
  }
};
