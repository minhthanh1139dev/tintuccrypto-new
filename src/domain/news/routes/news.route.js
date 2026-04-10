"use strict";

import express from "express";
import asyncHandler from "express-async-handler";
import newsController from "../controllers/news.controller.js";

const router = express.Router();

router.get("/", asyncHandler((req, res) => newsController.list(req, res)));
router.get("/featured", asyncHandler((req, res) => newsController.getFeatured(req, res)));
router.get("/:id", asyncHandler((req, res) => newsController.getById(req, res)));

export default router;
