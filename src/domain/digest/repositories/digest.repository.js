"use strict";

import Digest from "../../../models/digest.model.js";
import { paginateQuery } from "../../../shared/utils/pagination.js";

class DigestRepository {
  async create(data) {
    return Digest.create(data);
  }

  async findById(id) {
    return Digest.findById(id).lean();
  }

  async findBySlug(slug) {
    return Digest.findOne({ slug }).lean();
  }

  async findLatestByType(type, region) {
    const filters = { type, status: "published" };
    if (region) filters.region = region;
    return Digest.findOne(filters).sort({ periodEnd: -1 }).lean();
  }

  async findAll({ filters, sort = { periodEnd: -1 }, paginator } = {}) {
    return paginateQuery(Digest, { filters, sort, paginator });
  }

  async updateStatus(id, status) {
    return Digest.findByIdAndUpdate(id, { status }, { new: true });
  }

  async update(id, data) {
    return Digest.findByIdAndUpdate(id, data, { new: true });
  }

  async existsForPeriod(type, region, periodStart, periodEnd) {
    return Digest.exists({ type, region, periodStart, periodEnd });
  }
}

export default new DigestRepository();
