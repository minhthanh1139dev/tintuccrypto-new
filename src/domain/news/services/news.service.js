"use strict";

import { AppError } from "../../../shared/middlewares/errorHandler.middleware.js";
import newsRepository from "../repositories/news.repository.js";
import { NEWS_CODES } from "../constants/news.codes.js";

class NewsService {
  async getById(id) {
    const item = await newsRepository.findById(id);
    if (!item) throw new AppError(NEWS_CODES.NEWS_NOT_FOUND, 404);
    return item;
  }

  async list({ page, limit, region, category, coin, sentiment, status = "published" }) {
    const filters = { status };
    if (region) filters.region = region;
    if (category) filters.category = category;
    if (coin) filters.coins = coin;
    if (sentiment) filters.sentiment = sentiment;

    return newsRepository.findAll({
      filters,
      sort: { createdAt: -1 },
      paginator: { page, limit },
    });
  }

  async getFeatured(limit = 5) {
    return newsRepository.findAll({
      filters: { isFeatured: true, status: "published" },
      sort: { createdAt: -1 },
      paginator: { page: 1, limit },
    });
  }
}

export default new NewsService();
