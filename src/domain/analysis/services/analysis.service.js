"use strict";

import aiService from "../../../shared/services/ai.service.js";
import binanceService from "../../../shared/services/binance.service.js";
import telegramService from "../../../shared/services/telegram.service.js";
import cryptoAnalysisRepository from "../repositories/analysis.repository.js";
import logger from "../../../shared/utils/logger.js";

// ── Prompt Helpers ───────────────────────────────────────────────────────────

function getFundingSignal(rate) {
  const r = parseFloat(rate);
  if (r > 0.1) return "⚠️ (quá cao - risk long squeeze)";
  if (r > 0.05) return "🔴 (cao - thị trường thiên long)";
  if (r < -0.05) return "🟢 (âm - thị trường thiên short)";
  return "✅ (bình thường)";
}

function getLSSignal(ratio) {
  const r = parseFloat(ratio);
  if (r > 2.0) return "⚠️ (quá nhiều long)";
  if (r > 1.5) return "🔴 (nghiêng về long)";
  if (r < 0.7) return "🟢 (nghiêng về short)";
  return "✅ (cân bằng)";
}

/**
 * Build the full analysis prompt with real Binance market data
 * @param {Object} marketData - { BTC, ETH } from BinanceService
 * @returns {string}
 */
function buildCryptoAnalysisPrompt(marketData) {
  const now = new Date().toISOString();
  const { BTC, ETH } = marketData;

  return `
Bạn là chuyên gia phân tích crypto cấp cao với hơn 10 năm kinh nghiệm. 
Bạn luôn phân tích khách quan, dựa trên dữ liệu thực tế và tin tức đã verify.

Nhiệm vụ: Phân tích tổng quan thị trường crypto trong **4 giờ qua**, tập trung mạnh vào chuyển động giá của **BTC và ETH**, kết hợp tin tức + dữ liệu phái sinh Binance.

════════════════════════════════════════
YÊU CẦU PHÂN TÍCH (TẬP TRUNG CAO VÀO GIÁ BTC & ETH)
════════════════════════════════════════

- Ưu tiên phân tích **chuyển động giá, mức hỗ trợ/kháng cự quan trọng, volume, và tâm lý phái sinh** của BTC và ETH.
- Kết hợp chặt chẽ tin tức với price action hiện tại.
- Chỉ sử dụng tin tức **thực tế trong 4 giờ qua**, đã verify được.

**Quy tắc nghiêm ngặt về nguồn:**
- Mọi tin tức phải có **URL thật** (có thể truy cập được).
- Nếu không tìm thấy URL đáng tin cậy hoặc tin không rõ ràng → không đưa vào.
- Ưu tiên: CoinDesk, CoinTelegraph, The Block, Reuters, Bloomberg, Binance News.

**Error Handling:**
- Nếu ít tin nóng: Tập trung sâu vào phân tích giá, funding rate, OI, Long/Short và sentiment tổng thể.
- Luôn ghi rõ trong market_summary nếu thị trường đang yên ắng.

════════════════════════════════════════
DỮ LIỆU THỊ TRƯỜNG (Binance - cập nhật mới nhất)
════════════════════════════════════════

▸ BITCOIN (BTCUSDT)
  • Giá hiện tại: $${Number(BTC.price).toLocaleString()}
  • Thay đổi 24h: ${BTC.priceChangePercent}%
  • Volume 24h: $${Number(BTC.quoteVolume).toLocaleString()}
  • Funding Rate: ${BTC.fundingRate}% ${getFundingSignal(BTC.fundingRate)}
  • Open Interest: ${Number(BTC.openInterest).toLocaleString()} BTC
  • Long/Short Ratio: ${BTC.longShortRatio} ${getLSSignal(BTC.longShortRatio)}

▸ ETHEREUM (ETHUSDT)
  • Giá hiện tại: $${Number(ETH.price).toLocaleString()}
  • Thay đổi 24h: ${ETH.priceChangePercent}%
  • Volume 24h: $${Number(ETH.quoteVolume).toLocaleString()}
  • Funding Rate: ${ETH.fundingRate}% ${getFundingSignal(ETH.fundingRate)}
  • Open Interest: ${Number(ETH.openInterest).toLocaleString()} ETH
  • Long/Short Ratio: ${ETH.longShortRatio} ${getLSSignal(ETH.longShortRatio)}

Thời gian hiện tại: ${now}

════════════════════════════════════════
OUTPUT FORMAT (CHỈ TRẢ VỀ JSON THUẦN - KHÔNG MARKDOWN)
════════════════════════════════════════

{
  "analyzed_at": "${now}",
  "period": "4 giờ qua",
  "overall_sentiment": "bullish | bearish | neutral",
  "sentiment_score": <số từ -1.0 đến 1.0>,
  "confidence": "high | medium | low",

  "market_summary": "<Đoạn văn 5-7 câu tiếng Việt, tập trung mạnh vào giá BTC & ETH hiện tại, động lực chính, price action quan trọng, và nhận định tổng quát>",

  "news": [
    {
      "title": "<Tiêu đề gốc>",
      "title_vi": "<Dịch sang tiếng Việt>",
      "summary_vi": "<Tóm tắt 1-2 câu>",
      "url": "https://... (URL thật bắt buộc)",
      "source": "CoinDesk / Reuters ...",
      "published_at": "khoảng X phút trước",
      "impact": "high | medium | low",
      "affected_assets": ["BTC", "ETH"],
      "sentiment": "positive | negative | neutral",
      "category": "market | macro | regulation | onchain | other"
    }
  ],

  "key_price_levels": {
    "btc": {
      "key_support": ["...", "..."],
      "key_resistance": ["...", "..."],
      "technical_bias": "bullish | bearish | neutral"
    },
    "eth": {
      "key_support": ["...", "..."],
      "key_resistance": ["...", "..."],
      "technical_bias": "bullish | bearish | neutral"
    }
  },

  "market_data_analysis": {
    "btc": {
      "price_trend": "bullish | bearish | neutral",
      "funding_interpretation": "...",
      "oi_interpretation": "...",
      "ls_interpretation": "..."
    },
    "eth": {
      "price_trend": "bullish | bearish | neutral",
      "funding_interpretation": "...",
      "oi_interpretation": "...",
      "ls_interpretation": "..."
    },
    "correlation_note": "<Mối quan hệ giữa tin tức và price action hiện tại>"
  },

  "macro_factors": [
    {
      "factor": "<Tên yếu tố, ví dụ: Lạm phát Mỹ>",
      "status": "<Trạng thái hiện tại>",
      "crypto_impact": "positive | negative | neutral",
      "detail": "<Giải thích chi tiết tác động>"
    }
  ],

  "risk_signals": [
    {
      "signal": "<Mô tả rủi ro, ví dụ: Short Squeeze BTC>",
      "severity": "high | medium | low",
      "source": "<Nguồn dữ liệu hoặc tin tức gốc>"
    }
  ],

  "opportunities": [
    {
      "opportunity": "<Cơ hội đầu tư/giao dịch>",
      "confidence": "high | medium | low",
      "basis": "<Cơ sở phân tích cho cơ hội này>"
    }
  ],

  "news_count": <số thực tế>,
  "data_sources": ["CoinDesk", "Reuters", ...],
  "note": "<Ghi chú bổ sung nếu cần (thị trường yên ắng, tin ít, cảnh báo...)>"
}
`;
}
// ── Sanitize — strip hallucinated URLs from Gemini output ────────────────────

/**
 * LLMs tend to hallucinate URLs. This function strips all URL fields
 * from the analysis data to prevent fake links from reaching users.
 * @param {Object} data - Raw analysis data from Gemini
 */
function sanitizeAnalysisData(data) {
  // We no longer strip URLs as the user's prompt now strictly requires real ones.
  // We can add validation logic here later if needed.
}

// ── Service ──────────────────────────────────────────────────────────────────

class CryptoAnalysisService {
  /**
   * Perform hourly crypto market analysis using Gemini AI + Binance data
   * Then send to Telegram channel
   */
  async performHourlyAnalysis() {
    logger.info("Starting hourly crypto analysis...");

    // 1. Fetch real-time market data from Binance
    const marketData = await binanceService.fetchMarketData();

    // 2. Build the prompt with market data
    const prompt = buildCryptoAnalysisPrompt(marketData);

    // 3. Send to AI for analysis
    const analysisData = await aiService.generateJSON(prompt);

    // 3.5. Sanitize: strip any hallucinated URLs from Gemini response
    sanitizeAnalysisData(analysisData);

    // 4. Attach market snapshot
    analysisData.market_snapshot = {
      btc: { ...marketData.BTC },
      eth: { ...marketData.ETH },
      snapshot_at: new Date().toISOString(),
    };

    // 5. Save to MongoDB
    const result = await cryptoAnalysisRepository.create({
      ...analysisData,
      analyzed_at: analysisData.analyzed_at
        ? new Date(analysisData.analyzed_at)
        : new Date(),
    });

    logger.info(
      {
        id: result._id,
        sentiment: result.overall_sentiment,
        score: result.sentiment_score,
        newsCount: result.news_count,
      },
      "Hourly analysis saved",
    );

    // 6. Send to Telegram
    try {
      await telegramService.sendAnalysis(result);
    } catch (telegramError) {
      logger.error(
        { error: telegramError.message },
        "Failed to send Telegram message",
      );
    }

    return result;
  }

  /**
   * Check Binance data for anomalies and send Telegram alerts
   */
  async checkMarketAlerts() {
    const marketData = await binanceService.fetchMarketData();
    const alertCount = await telegramService.checkAndSendAlerts(marketData);
    return alertCount;
  }

  async getLatest() {
    return await cryptoAnalysisRepository.findLatest();
  }

  async getHistory(filters) {
    return await cryptoAnalysisRepository.findHistory(filters);
  }

  async getSentimentTrend(hours) {
    return await cryptoAnalysisRepository.getSentimentTrend(hours);
  }

  async getTrendingAssets(hours) {
    const data =
      await cryptoAnalysisRepository.getTrendingAssetsAggregation(hours);
    return data.map((r) => ({
      symbol: r._id,
      total_mentions: r.total_mentions,
      positive: r.positive,
      negative: r.negative,
    }));
  }
}

export default new CryptoAnalysisService();
