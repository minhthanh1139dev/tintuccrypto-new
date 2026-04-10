"use strict"

import express from "express";
import asyncHandler from "express-async-handler";
import fileController from "../controllers/file.controller.js";

const router = express.Router();

// Specific endpoints for different file types
router.get("/image/:id", asyncHandler(fileController.getImage.bind(fileController)));
router.get("/document/:id", asyncHandler(fileController.getDocument.bind(fileController)));
router.get("/video/:id", asyncHandler(fileController.getVideo.bind(fileController)));

// Fallback generic download if still needed
router.get("/:id", asyncHandler(fileController.getFile.bind(fileController)));

export default router;
