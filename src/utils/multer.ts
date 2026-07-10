import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = "src/public/uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);

    // Sanitize filename (remove special characters)
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");

    cb(null, `${file.fieldname}-${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for validation
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  // allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|avi|mov|mkv|webm/;
  const allowedDocTypes = /pdf|doc|docx/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  // Check based on field name
  if (file.fieldname === "image" || file.fieldname === "thumbnail") {
    const isValidImage =
      allowedImageTypes.test(extname) &&
      allowedImageTypes.test(mimetype.split("/")[1]);

    if (isValidImage) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  } else if (file.fieldname === "video") {
    const isValidVideo =
      allowedVideoTypes.test(extname) &&
      (mimetype.startsWith("video/") ||
        mimetype === "application/octet-stream");

    if (isValidVideo) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  } else if (file.fieldname === "document") {
    const isValidDoc =
      allowedDocTypes.test(extname) &&
      (mimetype.includes("pdf") || mimetype.includes("document"));

    if (isValidDoc) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024,
    files: 5,
  },
  fileFilter: fileFilter,
});

export default upload;
