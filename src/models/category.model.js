"use strict";

import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
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
    description: {
      type: String,
      default: "",
    },
    color: {
      // Hex color for UI badge, e.g. "#F7931A"
      type: String,
      default: "#6366f1",
    },
    order: {
      // Display order in navigation
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "categories",
  }
);

CategorySchema.index({ order: 1 });

const Category = mongoose.model("Category", CategorySchema);

export default Category;
