"use strict"

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import fileRepository from "../repositories/file.repository.js";
import { AppError } from "../../../shared/middlewares/errorHandler.middleware.js";
import logger from "../../../shared/utils/logger.js";
import storage from "../storage/storage.provider.js";
import { FILE_CODES } from "../constants/file.codes.js";

const uploadsDir = path.join(process.cwd(), "uploads");

const ensureUploadsDir = async () => {
  await fs.promises.mkdir(uploadsDir, { recursive: true });
};

const containsScriptContent = async (filePath, mimeType) => {
  const textLikeMimes = [
    "text/plain",
    "application/json",
    "application/xml",
    "text/xml",
  ];

  if (!textLikeMimes.includes((mimeType || "").toLowerCase())) {
    return false;
  }

  const content = await fs.promises.readFile(filePath, "utf8");
  const suspiciousPatterns = [
    /<script\b/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /eval\(/i,
    /child_process/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(content));
};

class FileService {
  async getAllFiles({ paginator } = {}) {
    return await fileRepository.findAll({ paginator });
  }

  async getPublicFileById(id) {
    const fileDoc = await fileRepository.findById(id);
    if (!fileDoc) {
      throw new AppError(FILE_CODES.FILE_NOT_FOUND, 404);
    }

    if (!fileDoc.isPublic) {
      throw new AppError(FILE_CODES.FILE_ACCESS_DENIED, 403);
    }

    const filePath = path.join(uploadsDir, fileDoc.storageKey);
    try {
      await fs.promises.access(filePath);
    } catch {
      throw new AppError(FILE_CODES.FILE_NOT_FOUND, 404); // Using the same FILE_NOT_FOUND code
    }

    return fileDoc;
  }

  async uploadFile(file) {
    if (!file) {
      throw new AppError(FILE_CODES.FILE_NOT_UPLOADED, 400);
    }

    const docId = new mongoose.Types.ObjectId();
    const isImage = file.mimetype?.startsWith("image/");

    if (!isImage) {
      const hasScriptContent = await containsScriptContent(file.path, file.mimetype);
      if (hasScriptContent) {
        await fs.promises.unlink(file.path).catch(() => { });
        throw new AppError(FILE_CODES.FILE_CONTENT_BLOCKED, 400);
      }
    }

    // Delegate upload to storage abstraction
    const uploadResult = await storage.upload(file, docId, isImage);

    let kind = "file";
    if (isImage) {
      kind = "image";
    } else if (file.mimetype?.startsWith("video/")) {
      kind = "video";
    } else if (
      [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.mimetype)
    ) {
      kind = "document";
    }

    return await fileRepository.create({
      _id: docId,
      storageKey: uploadResult.storageKey,
      originalName: file.originalname,
      mime: uploadResult.mime,
      size: uploadResult.size,
      kind,
      isPublic: true,
    });
  }

  async deleteFile(id) {
    const fileDoc = await fileRepository.findById(id);
    if (!fileDoc) {
      throw new AppError(FILE_CODES.FILE_NOT_FOUND, 404);
    }

    await fileRepository.delete(id);
    
    // Delegate deletion to storage abstraction
    await storage.delete(fileDoc.storageKey);

    return true;
  }

  async cleanupOrphanUploads() {
    await ensureUploadsDir();

    const allEntries = await fs.promises.readdir(uploadsDir, {
      withFileTypes: true,
    });

    const diskFiles = allEntries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    if (!diskFiles.length) {
      logger.debug("cleanup orphan uploads skipped: uploads directory empty");
      return;
    }

    const existingFiles = await fileRepository.findByStorageKeys(diskFiles);
    const existingStorageKeySet = new Set(
      existingFiles.map((item) => item.storageKey),
    );

    const orphanFiles = diskFiles.filter(
      (fileName) => !existingStorageKeySet.has(fileName),
    );

    if (!orphanFiles.length) {
      logger.debug("cleanup orphan uploads finished: no orphan file");
      return;
    }

    await Promise.all(
      orphanFiles.map(async (fileName) => {
        await storage.delete(fileName).catch((error) => {
          logger.warn(
            { fileName, error: error.message },
            "failed to remove orphan upload",
          );
        });
      }),
    );
  }
}

export default new FileService();
