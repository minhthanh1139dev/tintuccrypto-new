"use strict";

import express from "express";
import postController from "../controllers/post.controller.js";
import { verifyToken, verifyAdmin } from "../../../shared/middlewares/auth.middleware.js";

const router = express.Router();

// ── Public routes ────────────────────────────────────────────────────────────
// GET /api/v1/posts?category=&tag=&limit=&page=&featured=
router.get("/", postController.getAll);

// GET /api/v1/posts/:slug
router.get("/:slug", postController.getBySlug);

// ── Admin routes ─────────────────────────────────────────────────────────────
// GET /api/v1/posts/admin/all (list all including drafts)
router.get("/admin/all", verifyAdmin, postController.getAllAdmin);

// GET /api/v1/posts/admin/:id
router.get("/admin/:id", verifyAdmin, postController.getById);

// POST /api/v1/posts
router.post("/", verifyAdmin, postController.create);

// PATCH /api/v1/posts/:id
router.patch("/:id", verifyAdmin, postController.update);

// DELETE /api/v1/posts/:id
router.delete("/:id", verifyAdmin, postController.delete);

export default router;
