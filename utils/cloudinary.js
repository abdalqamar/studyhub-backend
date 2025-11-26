import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Upload function
const uploadOnCloudinary = async (
  localFilePath,
  folder = process.env.FOLDER_NAME
) => {
  try {
    if (!localFilePath) return null;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder,
    });

    await fs.unlink(localFilePath).catch((err) => {
      console.error("Failed to delete temp file:", err);
    });

    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      duration: result.duration ?? null,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    if (localFilePath) {
      await fs.unlink(localFilePath).catch((unlinkErr) => {
        console.error(
          "Failed to delete temp file after upload failure:",
          unlinkErr
        );
      });
    }

    return null;
  }
};

// Delete function
const deleteFromCloudinary = async (publicId) => {
  try {
    const resource = await cloudinary.api.resource(publicId);

    const resourceType = resource.resource_type;
    if (!publicId) {
      return resource.status(404).json({
        success: false,
        message: "No publicId provided for deletion",
      });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return false;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
