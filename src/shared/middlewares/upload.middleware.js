"use strict"

import multer from "multer";
import path from "path";
import fs from "fs";
import { ALLOWED_FILE_MIMES, MAX_UPLOAD_SIZE_MB } from "../constants/app.constants.js";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const blockedExtensions = new Set([
  ".js", ".mjs", ".cjs", ".html", ".htm", ".svg",
  ".exe", ".bat", ".cmd", ".sh", ".php", ".py",
]);

const blockedMimes = new Set([
  "text/html",
  "application/javascript",
  "text/javascript",
  "image/svg+xml",
  "application/x-msdownload",
  "application/x-sh",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-");
    cb(null, `${safeBaseName || "file"}-${uniqueSuffix}${ext}`);
  },
});

/**
 * Factory middleware to create multer instances with specific constraints
 */
export const createUploadMiddleware = ({
  allowedMimes = ALLOWED_FILE_MIMES,
  maxSizeMB = MAX_UPLOAD_SIZE_MB,
} = {}) => {
  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();

    // Global security check
    if (blockedExtensions.has(ext) || blockedMimes.has(mime)) {
      return cb(new Error("Blocked file type for security reasons"), false);
    }

    // Dynamic constraint check
    if (!allowedMimes.includes(mime)) {
      return cb(new Error(`MIME type is not allowed. Allowed types: ${allowedMimes.join(", ")}`), false);
    }

    return cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
  });
};

/* --- Common predefined middlewares --- */

// Default generic file upload
export const uploadSingleGlobal = createUploadMiddleware().single("file");
export const uploadMultipleGlobal = createUploadMiddleware().array("files", 10);

// Image only upload (jpeg, png, webp, gif)
export const uploadImageSingle = createUploadMiddleware({
  allowedMimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxSizeMB: 5, // example: restrict images to 5MB
}).single("file");
export const uploadImageMultiple = createUploadMiddleware({
  allowedMimes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxSizeMB: 5,
}).array("files", 10);
