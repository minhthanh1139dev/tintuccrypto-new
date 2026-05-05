"use strict";

import asyncHandler from "express-async-handler";
import coingeckoService from "../../../shared/services/coingecko.service.js";
import { OK } from "../../../shared/utils/response.js";

class MarketController {
  getTopCoins = asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 50, 250);
    const currency = req.query.currency || "usd";
    const data = await coingeckoService.getTopCoins(limit, currency);
    return new OK({ data }).send(res);
  });

  getCoinDetail = asyncHandler(async (req, res) => {
    const data = await coingeckoService.getCoinDetail(req.params.coinId);
    return new OK({ data }).send(res);
  });

  getGlobalStats = asyncHandler(async (req, res) => {
    const data = await coingeckoService.getGlobalStats();
    return new OK({ data }).send(res);
  });
}

export default new MarketController();
