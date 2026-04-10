"use strict";

import response from "../../../shared/utils/response.js";
import newsService from "../services/news.service.js";

class NewsController {
  async list(req, res) {
    const { page, limit, region, category, coin, sentiment } = req.query;
    const result = await newsService.list({ page, limit, region, category, coin, sentiment });
    return response.paginate(res, result.items, result.total, result.page, result.limit);
  }

  async getById(req, res) {
    const item = await newsService.getById(req.params.id);
    return response.success(res, item);
  }

  async getFeatured(req, res) {
    const limit = parseInt(req.query.limit, 10) || 5;
    const result = await newsService.getFeatured(limit);
    return response.success(res, result.items);
  }
}

export default new NewsController();
