"use strict"

import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import response from "../../../shared/utils/response.js";
import { AppError } from "../../../shared/middlewares/errorHandler.middleware.js";
import fileService from "../services/file.service.js";
import { FILE_CODES } from "../constants/file.codes.js";

class FileController {
  async getAllFiles(req, res) {
    const { page, limit } = req.query; // get from req.query to pass paginator
    const { items, total, page: currentPage, limit: currentLimit } = await fileService.getAllFiles({ paginator: { page, limit } });

    return response.paginate(res, items.map((fileDoc) => ({
      id: fileDoc._id,
      originalName: fileDoc.originalName,
      storageKey: fileDoc.storageKey,
      url: `/api/v1/files/${fileDoc._id}`,
      mime: fileDoc.mime,
      size: fileDoc.size,
      kind: fileDoc.kind,
      isPublic: fileDoc.isPublic,
      createdAt: fileDoc.createdAt,
    })), total, currentPage, currentLimit, FILE_CODES.SUCCESS);
  }

  async _getFileByKind(req, res, expectedKind) {
    const { id } = req.params;
    const fileDoc = await fileService.getPublicFileById(id);

    if (expectedKind && fileDoc.kind !== expectedKind) {
      throw new AppError(FILE_CODES.FILE_TYPE_MISMATCH, 400);
    }

    const filePath = path.join(process.cwd(), "uploads", fileDoc.storageKey);
    res.setHeader("Content-Type", fileDoc.mime || "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

    await pipeline(fs.createReadStream(filePath), res);
  }

  async getImage(req, res) {
    await this._getFileByKind(req, res, "image");
  }

  async getDocument(req, res) {
    await this._getFileByKind(req, res, "document");
  }

  async getVideo(req, res) {
    await this._getFileByKind(req, res, "video");
  }

  async getFile(req, res) {
    await this._getFileByKind(req, res, null);
  }

  async uploadFile(req, res) {
    const fileDoc = await fileService.uploadFile(req.file);

    return response.success(res, {
      id: fileDoc._id,
      originalName: fileDoc.originalName,
      storageKey: fileDoc.storageKey,
      url: `/api/v1/files/${fileDoc._id}`,
      mime: fileDoc.mime,
      size: fileDoc.size,
      kind: fileDoc.kind,
      isPublic: fileDoc.isPublic,
      createdAt: fileDoc.createdAt,
    }, 201, "File uploaded successfully");
  }

  async deleteFile(req, res) {
    await fileService.deleteFile(req.params.id);
    return response.success(res, null, 200, "File deleted successfully");
  }
}

export default new FileController();
