import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import dotenv from "dotenv";
import { CloudinaryUploadResult } from "../types/cloudinary.types.js";
dotenv.config();

const isDevelopment = process.env.NODE_ENV !== "production";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Upload
export const uploadOnCloudinary = async (
  localFilePath: string,
  folder = process.env.FOLDER_NAME,
): Promise<CloudinaryUploadResult | null> => {
  if (!localFilePath) return null;

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder,
    });

    // Temp file cleanup
    fs.unlink(localFilePath).catch((err) => {
      if (isDevelopment && err instanceof Error) {
        console.error("Failed to delete temp file:", err.message);
      }
    });

    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      duration: result.duration ?? null,
    };
  } catch (error) {
    if (isDevelopment && error instanceof Error) {
      console.error("Cloudinary Upload Error:", error.message);
    }
    fs.unlink(localFilePath).catch(() => null);
    return null;
  }
};

//  Delete
export const deleteFromCloudinary = async (
  secureUrl: string,
  explicitPublicId: string | null = null,
): Promise<boolean> => {
  if (!secureUrl && !explicitPublicId) return false;

  try {
    let fullPublicId = explicitPublicId;

    // Detect resource type from URL
    const resourceType = secureUrl?.includes("/video/")
      ? "video"
      : secureUrl?.includes("/image/")
        ? "image"
        : "raw";

    if (!fullPublicId) {
      // Fallback: derive from URL (for assets created before publicId was stored)
      const parts = secureUrl.split("/");
      const fileWithExt = parts.pop();
      const publicId = fileWithExt!.split(".")[0];
      const folder = process.env.FOLDER_NAME;
      fullPublicId = folder ? `${folder}/${publicId}` : publicId;
    }

    const result = await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: resourceType,
    });

    if (result.result === "not found" && isDevelopment) {
      console.warn(`Cloudinary delete: "${fullPublicId}" not found`);
    }

    return result.result === "ok" || result.result === "not found";
  } catch (err) {
    if (isDevelopment && err instanceof Error) {
      console.error("Cloudinary delete error:", err.message);
    }
    return false;
  }
};

export const uploadWithRollback = async (
  localFilePath: string,
  folder = process.env.FOLDER_NAME,
): Promise<{
  uploadResult: CloudinaryUploadResult;
  rollback: () => Promise<void>;
}> => {
  const uploadResult = await uploadOnCloudinary(localFilePath, folder);

  if (!uploadResult) {
    throw new Error("Cloudinary upload failed");
  }

  const rollback = async (): Promise<void> => {
    await deleteFromCloudinary(
      uploadResult.secure_url,
      uploadResult.public_id,
    ).catch((err) => {
      if (isDevelopment && err instanceof Error) {
        console.error("Rollback delete failed:", err.message);
      }
    });
  };

  return { uploadResult, rollback };
};
