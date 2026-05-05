"use strict"

import express from "express";
import userRoutes from "../domain/user/routes/user.route.js";
import fileRoutes from "../domain/file/routes/file.route.js";
import adminFileRoutes from "../domain/file/routes/adminFile.route.js";
import authRoutes from "../domain/auth/routes/auth.route.js";
import analysisRoutes from "../domain/analysis/routes/analysis.route.js";
import marketRoutes from "../domain/market/routes/market.route.js";
import postRoutes from "../domain/post/routes/post.route.js";
import categoryRoutes from "../domain/category/routes/category.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin/files", adminFileRoutes);
router.use("/files", fileRoutes);
router.use("/analyses", analysisRoutes);
router.use("/market", marketRoutes);
router.use("/posts", postRoutes);
router.use("/categories", categoryRoutes);

export default router;
