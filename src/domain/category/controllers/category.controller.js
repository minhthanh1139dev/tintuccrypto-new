"use strict";

import asyncHandler from "express-async-handler";
import categoryService from "../services/category.service.js";
import { OK, CREATED } from "../../../shared/utils/response.js";

class CategoryController {
  getAll = asyncHandler(async (req, res) => {
    const data = await categoryService.findAll();
    return new OK({ data }).send(res);
  });

  getBySlug = asyncHandler(async (req, res) => {
    const data = await categoryService.findBySlug(req.params.slug);
    return new OK({ data }).send(res);
  });

  create = asyncHandler(async (req, res) => {
    const data = await categoryService.create(req.body);
    return new CREATED({ data, message: "Category đã được tạo" }).send(res);
  });

  update = asyncHandler(async (req, res) => {
    const data = await categoryService.update(req.params.id, req.body);
    return new OK({ data, message: "Category đã được cập nhật" }).send(res);
  });

  delete = asyncHandler(async (req, res) => {
    await categoryService.delete(req.params.id);
    return new OK({ message: "Category đã được xóa" }).send(res);
  });
}

export default new CategoryController();
