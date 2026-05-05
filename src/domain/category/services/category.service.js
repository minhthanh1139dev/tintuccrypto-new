"use strict";

import categoryRepository from "../repositories/category.repository.js";
import { BAD_REQUEST, NOT_FOUND } from "../../../shared/utils/response.js";

class CategoryService {
  async create(data) {
    const existing = await categoryRepository.findBySlug(data.slug);
    if (existing) {
      throw new BAD_REQUEST({ message: `Slug "${data.slug}" đã tồn tại` });
    }
    return await categoryRepository.create(data);
  }

  async findAll() {
    return await categoryRepository.findAll();
  }

  async findBySlug(slug) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) throw new NOT_FOUND({ message: "Category không tồn tại" });
    return category;
  }

  async update(id, data) {
    const category = await categoryRepository.update(id, data);
    if (!category) throw new NOT_FOUND({ message: "Category không tồn tại" });
    return category;
  }

  async delete(id) {
    const category = await categoryRepository.delete(id);
    if (!category) throw new NOT_FOUND({ message: "Category không tồn tại" });
    return category;
  }
}

export default new CategoryService();
