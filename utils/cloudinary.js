import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import dotenv from "dotenv";
dotenv.config();

const isDevelopment = process.env.NODE_ENV !== "production";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Upload function
const uploadOnCloudinary = async (
  localFilePath,
  folder = process.env.FOLDER_NAME,
) => {
  try {
    if (!localFilePath) return null;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder,
    });

    await fs.unlink(localFilePath).catch((err) => {
      if (isDevelopment) console.error("Failed to delete temp file:", err);
    });

    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      duration: result.duration ?? null,
    };
  } catch (error) {
    if (isDevelopment) console.log("Cloudinary Upload Error:", error);

    if (localFilePath) {
      await fs.unlink(localFilePath).catch((unlinkErr) => {
        if (isDevelopment)
          console.log(
            "Failed to delete temp file after upload failure:",
            unlinkErr,
          );
      });
    }

    return null;
  }
};

// Delete function
const deleteFromCloudinary = async (secureUrl) => {
  if (!secureUrl) return;

  try {
    const parts = secureUrl.split("/");
    const fileWithExt = parts.pop();
    const publicId = fileWithExt.split(".")[0];

    const folder = process.env.FOLDER_NAME;
    const fullPublicId = folder ? `${folder}/${publicId}` : publicId;

    const resourceType = secureUrl.includes("/image/")
      ? "image"
      : secureUrl.includes("/video/")
        ? "video"
        : "raw";

    const result = await cloudinary.uploader.destroy(fullPublicId, {
      resource_type: resourceType,
    });

    return result.result === "ok" || result.result === "not found";
  } catch (err) {
    if (isDevelopment) console.log("Cloudinary delete error:", err.message);
    return false;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
