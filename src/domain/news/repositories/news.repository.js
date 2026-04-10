"use strict";

import NewsItem from "../../../models/newsItem.model.js";
import { paginateQuery } from "../../../shared/utils/pagination.js";

class NewsRepository {
  async create(data) {
    return NewsItem.create(data);
  }

  async createMany(items) {
    if (!items.length) return [];
    return NewsItem.insertMany(items, { ordered: false }).catch((err) => {
      if (err.code === 11000) return err.insertedDocs || [];
      throw err;
    });
  }

  async findById(id) {
    return NewsItem.findById(id).lean();
  }

  async findAll({ filters, sort = { createdAt: -1 }, paginator, populate } = {}) {
    return paginateQuery(NewsItem, { filters, sort, paginator, populate });
  }

  async findByDateRange(start, end, extraFilters = {}) {
    return NewsItem.find({
      createdAt: { $gte: start, $lte: end },
      status: "published",
      ...extraFilters,
    })
      .sort({ impactScore: -1, createdAt: -1 })
      .lean();
  }

  async countByDateRange(start, end, extraFilters = {}) {
    return NewsItem.countDocuments({
      createdAt: { $gte: start, $lte: end },
      ...extraFilters,
    });
  }

  async updateStatus(id, status) {
    return NewsItem.findByIdAndUpdate(id, { status }, { new: true });
  }
}

export default new NewsRepository();
