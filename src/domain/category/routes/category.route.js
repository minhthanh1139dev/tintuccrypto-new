"use strict";

import express from "express";
import categoryController from "../controllers/category.controller.js";
import { verifyToken, verifyAdmin } from "../../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", categoryController.getAll);
router.get("/:slug", categoryController.getBySlug);

// Admin-only routes
router.post("/", verifyAdmin, categoryController.create);
router.patch("/:id", verifyAdmin, categoryController.update);
router.delete("/:id", verifyAdmin, categoryController.delete);

export default router;
