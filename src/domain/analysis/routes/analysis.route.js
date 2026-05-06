"use strict";

import express from "express";
import asyncHandler from "express-async-handler";
import analysisController from "../controllers/analysis.controller.js";

const router = express.Router();

router.get("/latest", asyncHandler(analysisController.getLatest));

router.get("/history", asyncHandler(analysisController.getHistory));

router.get("/sentiment-trend", asyncHandler(analysisController.getSentimentTrend));

router.get("/trending-assets", asyncHandler(analysisController.getTrendingAssets));

router.post("/trigger", asyncHandler(analysisController.triggerAnalysis));

router.post("/", asyncHandler(analysisController.generateAnalysis));

export default router;
