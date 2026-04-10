"use strict";

import response from "../../../shared/utils/response.js";
import digestService from "../services/digest.service.js";
import newsRepository from "../../news/repositories/news.repository.js";

class DigestController {
  async list(req, res) {
    const { page, limit, type, region } = req.query;
    const result = await digestService.list({ page, limit, type, region });
    return response.paginate(res, result.items, result.total, result.page, result.limit);
  }

  async getBySlug(req, res) {
    const digest = await digestService.getBySlug(req.params.slug);
    return response.success(res, digest);
  }

  async getLatest(req, res) {
    const { type } = req.params;
    const { region } = req.query;
    const digest = await digestService.getLatest(type, region);
    return response.success(res, digest);
  }

  async getDigestNews(req, res) {
    const digest = await digestService.getBySlug(req.params.slug);

    const newsItems = await newsRepository.findByDateRange(
      digest.periodStart,
      digest.periodEnd,
      { region: digest.region },
    );

    return response.success(res, {
      digest,
      news: newsItems,
    });
  }
}

export default new DigestController();
