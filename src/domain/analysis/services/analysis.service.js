"use strict";

import aiClient from "../../../shared/utils/aiClient.js";
import logger from "../../../shared/utils/logger.js";
import binanceService from "./binance.service.js";
import telegramService from "./telegram.service.js";
import analysisRepository from "../repositories/analysis.repository.js";
import newsRepository from "../../news/repositories/news.repository.js";
import config from "../../../config/app.config.js";

class AnalysisService {
  /**
   * Build the analysis prompt
   */
  _buildPrompt(marketData, recentNews) {
    const now = new Date().toISOString();
    const { BTC, ETH } = marketData;

    const newsText = recentNews.length > 0 
      ? recentNews.map(n => `- [${n.impactScore || 'MID'}] ${n.titleVi || n.title} (${n.source || 'Unknown'})`).join('\n')
      : "Không có tin tức nổi bật mới trong hệ thống.";

    return `
Bạn là chuyên gia phân tích crypto cấp cao. Phân tích thị trường trong 4 giờ qua dựa trên dữ liệu Binance và tin tức cung cấp.

════════════════════════════════════════
DỮ LIỆU THỊ TRƯỜNG (Binance)
════════════════════════════════════════
▸ BITCOIN (BTCUSDT): Price $${Number(BTC.price).toLocaleString()}, Change ${BTC.priceChangePercent}%, Funding ${BTC.fundingRate}%, OI ${Number(BTC.openInterest).toLocaleString()}, L/S ${BTC.longShortRatio}
▸ ETHEREUM (ETHUSDT): Price $${Number(ETH.price).toLocaleString()}, Change ${ETH.priceChangePercent}%, Funding ${ETH.fundingRate}%, OI ${Number(ETH.openInterest).toLocaleString()}, L/S ${ETH.longShortRatio}

════════════════════════════════════════
TIN TỨC GẦN ĐÂY (Trong hệ thống)
════════════════════════════════════════
${newsText}

Thời gian: ${now}

YÊU CẦU:
1. Phân tích chuyển động giá BTC/ETH, các mức hỗ trợ/kháng cự.
2. Kết hợp tin tức với dữ liệu phái sinh (Funding, OI, L/S) để đưa ra nhận định.
3. Output JSON thuần (không markdown).

FORMAT JSON:
{
  "analyzed_at": "${now}",
  "period": "4h",
  "overall_sentiment": "bullish | bearish | neutral",
  "sentiment_score": <số -1.0 đến 1.0>,
  "confidence": "high | medium | low",
  "market_summary": "<Tóm tắt tiếng Việt 5-7 câu>",
  "news": [
    {
      "title": "...", "title_vi": "...", "summary_vi": "...", "url": "...", "source": "...", "impact": "high|medium|low", "sentiment": "positive|negative|neutral"
    }
  ],
  "key_price_levels": {
    "btc": { "key_support": ["..."], "key_resistance": ["..."], "technical_bias": "..." },
    "eth": { "key_support": ["..."], "key_resistance": ["..."], "technical_bias": "..." }
  },
  "market_data_analysis": {
    "btc": { "price_trend": "...", "funding_interpretation": "...", "oi_interpretation": "...", "ls_interpretation": "..." },
    "eth": { "price_trend": "...", "funding_interpretation": "...", "oi_interpretation": "...", "ls_interpretation": "..." },
    "correlation_note": "..."
  },
  "macro_factors": [], "risk_signals": [], "opportunities": [],
  "news_count": ${recentNews.length},
  "note": "..."
}
`;
  }

  /**
   * Perform market analysis
   */
  async performAnalysis() {
    logger.info("Starting crypto market analysis...");

    try {
      // 1. Fetch market data
      const marketData = await binanceService.fetchMarketData();

      // 2. Fetch recent news (last 4 hours)
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const recentNews = await newsRepository.findByDateRange(fourHoursAgo, new Date());

      // 3. Prepare AI call (Forced to Grok for deep analysis)
      const provider = "grok";
      const model = "grok-3";

      const prompt = this._buildPrompt(marketData, recentNews);

      // 4. Call AI
      const aiResponse = await aiClient.chat({
        provider,
        model,
        callType: "deep_analysis",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        extra: { response_format: { type: "json_object" } }
      });

      let analysisData;
      try {
        analysisData = JSON.parse(aiResponse.content.replace(/```json/g, "").replace(/```/g, "").trim());
      } catch (e) {
        logger.error({ content: aiResponse.content }, "Failed to parse AI response as JSON");
        throw new Error("AI response parsing failed");
      }

      // 5. Attach snapshot
      analysisData.market_snapshot = {
        btc: { ...marketData.BTC },
        eth: { ...marketData.ETH },
        snapshot_at: new Date(),
      };
      analysisData.apiCallId = aiResponse.logId;

      // 6. Save to DB
      const saved = await analysisRepository.create({
        ...analysisData,
        analyzed_at: new Date(analysisData.analyzed_at || Date.now())
      });

      logger.info({ id: saved._id }, "Market analysis saved");

      // 7. Send to Telegram
      await telegramService.sendAnalysis(saved);

      return saved;
    } catch (error) {
      logger.error({ error: error.message }, "Market analysis failed");
      throw error;
    }
  }

  async checkAlerts() {
    const marketData = await binanceService.fetchMarketData();
    return await telegramService.checkAndSendAlerts(marketData);
  }
}

export default new AnalysisService();
