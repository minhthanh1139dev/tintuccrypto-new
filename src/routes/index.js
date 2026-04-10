"use strict"

import express from "express";
import userRoutes from "../domain/user/routes/user.route.js";
import fileRoutes from "../domain/file/routes/file.route.js";
import adminFileRoutes from "../domain/file/routes/adminFile.route.js";
import authRoutes from "../domain/auth/routes/auth.route.js";
import newsRoutes from "../domain/news/routes/news.route.js";
import digestRoutes from "../domain/digest/routes/digest.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/admin/files", adminFileRoutes);
router.use("/files", fileRoutes);
router.use("/news", newsRoutes);
router.use("/digests", digestRoutes);

export default router;
