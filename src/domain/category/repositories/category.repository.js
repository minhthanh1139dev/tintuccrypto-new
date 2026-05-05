"use strict";

import Category from "../../../models/category.model.js";

class CategoryRepository {
  async create(data) {
    return await Category.create(data);
  }

  async findAll() {
    return await Category.find().sort({ order: 1, name: 1 });
  }

  async findBySlug(slug) {
    return await Category.findOne({ slug });
  }

  async findById(id) {
    return await Category.findById(id);
  }

  async update(id, data) {
    return await Category.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return await Category.findByIdAndDelete(id);
  }
}

export default new CategoryRepository();
