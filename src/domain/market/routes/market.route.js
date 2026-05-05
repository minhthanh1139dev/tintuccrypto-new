"use strict";

import express from "express";
import marketController from "../controllers/market.controller.js";

const router = express.Router();

// GET /api/v1/market/coins?limit=50&currency=usd
router.get("/coins", marketController.getTopCoins);

// GET /api/v1/market/coins/:coinId
router.get("/coins/:coinId", marketController.getCoinDetail);

// GET /api/v1/market/global
router.get("/global", marketController.getGlobalStats);

export default router;
