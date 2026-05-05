"use strict";

import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      // Short summary for card/list view (1-2 sentences)
      type: String,
      default: "",
      maxlength: 300,
    },
    content: {
      // Full HTML/Markdown content
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    tags: [String],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    featured: {
      // Bài nổi bật — hiển thị ở top trang
      type: Boolean,
      default: false,
    },
    // SEO fields
    meta_title: { type: String, default: "" },
    meta_description: { type: String, default: "" },
    // Engagement stats
    view_count: { type: Number, default: 0 },
    published_at: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "posts",
  }
);

PostSchema.index({ category: 1, status: 1 });
PostSchema.index({ status: 1, published_at: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ featured: 1, status: 1 });

const Post = mongoose.model("Post", PostSchema);

export default Post;
