"use strict";

import express from "express";
import asyncHandler from "express-async-handler";
import digestController from "../controllers/digest.controller.js";

const router = express.Router();

router.get("/", asyncHandler((req, res) => digestController.list(req, res)));
router.get("/latest/:type", asyncHandler((req, res) => digestController.getLatest(req, res)));
router.get("/:slug", asyncHandler((req, res) => digestController.getBySlug(req, res)));
router.get("/:slug/news", asyncHandler((req, res) => digestController.getDigestNews(req, res)));

export default router;
