"use strict";

import postRepository from "../repositories/post.repository.js";
import { NOT_FOUND, BAD_REQUEST } from "../../../shared/utils/response.js";

class PostService {
  async create(data, userId) {
    const existing = await postRepository.findBySlug(data.slug);
    if (existing) {
      throw new BAD_REQUEST({ message: `Slug "${data.slug}" đã tồn tại` });
    }

    // Auto set published_at when status is published
    if (data.status === "published" && !data.published_at) {
      data.published_at = new Date();
    }

    return await postRepository.create({ ...data, author: userId });
  }

  async findAll(filters) {
    return await postRepository.findAll(filters);
  }

  async findBySlug(slug) {
    const post = await postRepository.findBySlug(slug);
    if (!post) throw new NOT_FOUND({ message: "Bài viết không tồn tại" });

    // Increment view count in background (fire & forget)
    postRepository.incrementViewCount(post._id).catch(() => {});

    return post;
  }

  async findById(id) {
    const post = await postRepository.findById(id);
    if (!post) throw new NOT_FOUND({ message: "Bài viết không tồn tại" });
    return post;
  }

  async update(id, data) {
    // Set published_at when publishing for the first time
    if (data.status === "published" && !data.published_at) {
      const existing = await postRepository.findById(id);
      if (existing && existing.status !== "published") {
        data.published_at = new Date();
      }
    }

    const post = await postRepository.update(id, data);
    if (!post) throw new NOT_FOUND({ message: "Bài viết không tồn tại" });
    return post;
  }

  async delete(id) {
    const post = await postRepository.delete(id);
    if (!post) throw new NOT_FOUND({ message: "Bài viết không tồn tại" });
    return post;
  }
}

export default new PostService();
