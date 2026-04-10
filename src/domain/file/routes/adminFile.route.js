"use strict"

import express from "express";
import asyncHandler from "express-async-handler";
import fileController from "../controllers/file.controller.js";
import { verifyAdmin } from "../../../shared/middlewares/auth.middleware.js";
import {
  uploadSingleGlobal,
  uploadImageSingle,
  createUploadMiddleware
} from "../../../shared/middlewares/upload.middleware.js";
import { createRateLimiter } from "../../../shared/middlewares/rateLimit.middleware.js";
import {
  UPLOAD_RATE_LIMIT_WINDOW_MS,
  UPLOAD_RATE_LIMIT_MAX,
} from "../../../shared/constants/app.constants.js";

const router = express.Router();

const uploadRateLimiter = createRateLimiter({
  windowMs: UPLOAD_RATE_LIMIT_WINDOW_MS,
  max: UPLOAD_RATE_LIMIT_MAX,
  keyPrefix: "upload",
  message: "Too many upload requests. Please slow down.",
});

const uploadDocumentSingle = createUploadMiddleware({
  allowedMimes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  maxSizeMB: 10,
}).single("file");

const uploadVideoSingle = createUploadMiddleware({
  allowedMimes: ["video/mp4", "video/webm"],
  maxSizeMB: 50,
}).single("file");

// --- API Endpoints ---

router.post(
  "/image",
  verifyAdmin,
  uploadRateLimiter,
  uploadImageSingle,
  asyncHandler(fileController.uploadFile),
);

router.post(
  "/document",
  verifyAdmin,
  uploadRateLimiter,
  uploadDocumentSingle,
  asyncHandler(fileController.uploadFile),
);

router.post(
  "/video",
  verifyAdmin,
  uploadRateLimiter,
  uploadVideoSingle,
  asyncHandler(fileController.uploadFile),
);

// Fallback generic upload if still needed
router.post(
  "/",
  verifyAdmin,
  uploadRateLimiter,
  uploadSingleGlobal,
  asyncHandler(fileController.uploadFile),
);

router.get("/", verifyAdmin, asyncHandler(fileController.getAllFiles));

router.delete("/:id", verifyAdmin, asyncHandler(fileController.deleteFile));

export default router;
