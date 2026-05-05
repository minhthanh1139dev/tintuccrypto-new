"use strict";

import Post from "../../../models/post.model.js";

class PostRepository {
  async create(data) {
    return await Post.create(data);
  }

  async findAll({ status = "published", category, tag, limit = 20, page = 1, featured } = {}) {
    const filter = { status };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (featured !== undefined) filter.featured = featured;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Post.find(filter)
        .populate("category", "name slug color")
        .populate("author", "username")
        .select("-content") // exclude heavy content in list view
        .sort({ published_at: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Post.countDocuments(filter),
    ]);

    return { items, total, page: Number(page), limit: Number(limit) };
  }

  async findBySlug(slug) {
    return await Post.findOne({ slug })
      .populate("category", "name slug color")
      .populate("author", "username");
  }

  async findById(id) {
    return await Post.findById(id)
      .populate("category", "name slug color")
      .populate("author", "username");
  }

  async update(id, data) {
    return await Post.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Post.findByIdAndDelete(id);
  }

  async incrementViewCount(id) {
    return await Post.findByIdAndUpdate(id, { $inc: { view_count: 1 } });
  }
}

export default new PostRepository();
