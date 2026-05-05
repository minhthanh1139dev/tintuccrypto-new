"use strict";

import asyncHandler from "express-async-handler";
import postService from "../services/post.service.js";
import { OK, CREATED } from "../../../shared/utils/response.js";

class PostController {
  // Public: list published posts
  getAll = asyncHandler(async (req, res) => {
    const { category, tag, limit, page, featured } = req.query;
    const data = await postService.findAll({
      status: "published",
      category,
      tag,
      limit,
      page,
      featured: featured !== undefined ? featured === "true" : undefined,
    });
    return new OK({ data }).send(res);
  });

  // Public: get single post by slug + increment view
  getBySlug = asyncHandler(async (req, res) => {
    const data = await postService.findBySlug(req.params.slug);
    return new OK({ data }).send(res);
  });

  // Admin: get post by ID (including drafts)
  getById = asyncHandler(async (req, res) => {
    const data = await postService.findById(req.params.id);
    return new OK({ data }).send(res);
  });

  // Admin: list all posts (any status)
  getAllAdmin = asyncHandler(async (req, res) => {
    const { category, tag, limit, page, status } = req.query;
    const data = await postService.findAll({ category, tag, limit, page, status });
    return new OK({ data }).send(res);
  });

  // Admin: create new post
  create = asyncHandler(async (req, res) => {
    const data = await postService.create(req.body, req.user.id);
    return new CREATED({ data, message: "Bài viết đã được tạo" }).send(res);
  });

  // Admin: update post
  update = asyncHandler(async (req, res) => {
    const data = await postService.update(req.params.id, req.body);
    return new OK({ data, message: "Bài viết đã được cập nhật" }).send(res);
  });

  // Admin: delete post
  delete = asyncHandler(async (req, res) => {
    await postService.delete(req.params.id);
    return new OK({ message: "Bài viết đã được xóa" }).send(res);
  });
}

export default new PostController();
