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

  async fetchMarketData() {
    logger.info("Fetching Binance market data...");

    try {
      const [tickerRes, btcFundingRes, ethFundingRes, btcOIRes, ethOIRes, btcLSRes, ethLSRes] =
        await Promise.all([
          axios.get(`${this.baseUrl}/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]`),
          axios.get(`${this.fapiUrl}/fundingRate?symbol=BTCUSDT&limit=1`),
          axios.get(`${this.fapiUrl}/fundingRate?symbol=ETHUSDT&limit=1`),
          axios.get(`${this.fapiUrl}/openInterest?symbol=BTCUSDT`),
          axios.get(`${this.fapiUrl}/openInterest?symbol=ETHUSDT`),
          axios.get(`${this.futuresDataUrl}/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1`),
          axios.get(`${this.futuresDataUrl}/globalLongShortAccountRatio?symbol=ETHUSDT&period=1h&limit=1`),
        ]);

      const tickers = tickerRes.data;
      const btcFunding = btcFundingRes.data;
      const ethFunding = ethFundingRes.data;
      const btcOI = btcOIRes.data;
      const ethOI = ethOIRes.data;
      const btcLS = btcLSRes.data;
      const ethLS = ethLSRes.data;

      const btcTicker = tickers.find((t) => t.symbol === "BTCUSDT");
      const ethTicker = tickers.find((t) => t.symbol === "ETHUSDT");

      const result = {
        BTC: {
          price: btcTicker.lastPrice,
          priceChangePercent: btcTicker.priceChangePercent,
          quoteVolume: btcTicker.quoteVolume,
          highPrice: btcTicker.highPrice,
          lowPrice: btcTicker.lowPrice,
          fundingRate: (parseFloat(btcFunding[0].fundingRate) * 100).toFixed(4),
          openInterest: btcOI.openInterest,
          longShortRatio: parseFloat(btcLS[0].longShortRatio).toFixed(2),
        },
        ETH: {
          price: ethTicker.lastPrice,
          priceChangePercent: ethTicker.priceChangePercent,
          quoteVolume: ethTicker.quoteVolume,
          highPrice: ethTicker.highPrice,
          lowPrice: ethTicker.lowPrice,
          fundingRate: (parseFloat(ethFunding[0].fundingRate) * 100).toFixed(4),
          openInterest: ethOI.openInterest,
          longShortRatio: parseFloat(ethLS[0].longShortRatio).toFixed(2),
        },
      };

      logger.info(
        { btcPrice: result.BTC.price, ethPrice: result.ETH.price },
        "Binance data fetched"
      );

      return result;
    } catch (error) {
      logger.error({ error: error.message }, "Failed to fetch Binance market data");
      throw error;
    }
  }

# Market Analysis Record API

This API allows external tools to save pre-generated crypto market analysis data directly to the database. 

**Note:** This endpoint only performs a database "Create" operation. It does **NOT** call AI and does **NOT** send notifications to Telegram.

## Endpoint

**POST** `/api/v1/analysis`

## Full JSON Request Body Structure

Dưới đây là cấu trúc JSON đầy đủ nhất dựa trên Model `CryptoAnalysis`. Bạn có thể bỏ qua các trường không bắt buộc (optional).

```json
{
  "analyzed_at": "2026-05-06T12:00:00Z",
  "period": "4 giờ qua",
  "overall_sentiment": "bullish",
  "sentiment_score": 0.85,
  "confidence": "high",
  "market_summary": "Thị trường crypto ghi nhận đà tăng trưởng mạnh mẽ của BTC khi vượt ngưỡng 65k. ETH cũng bám sát với mức tăng 3% trong 4 giờ qua...",
  
  "news": [
    {
      "title": "Bitcoin Hits New Local High",
      "title_vi": "Bitcoin đạt mức cao nhất cục bộ mới",
      "summary_vi": "Giá BTC đã vượt qua ngưỡng kháng cự quan trọng nhờ dòng vốn lớn từ các quỹ ETF.",
      "url": "https://coindesk.com/example-news",
      "source": "CoinDesk",
      "published_at": "20 phút trước",
      "impact": "high",
      "affected_assets": ["BTC"],
      "sentiment": "positive",
      "category": "market"
    }
  ],

  "key_price_levels": {
    "btc": {
      "key_support": ["62000", "60500"],
      "key_resistance": ["66000", "68200"],
      "technical_bias": "bullish"
    },
    "eth": {
      "key_support": ["3150", "3000"],
      "key_resistance": ["3400", "3550"],
      "technical_bias": "bullish"
    }
  },

  "market_data_analysis": {
    "btc": {
      "price_trend": "bullish",
      "funding_interpretation": "Bình thường",
      "oi_interpretation": "Tăng mạnh (dòng tiền mới)",
      "ls_interpretation": "Nghiêng về Long"
    },
    "eth": {
      "price_trend": "bullish",
      "funding_interpretation": "Bình thường",
      "oi_interpretation": "Ổn định",
      "ls_interpretation": "Cân bằng"
    },
    "correlation_note": "BTC đang dẫn dắt thị trường, ETH đi theo sau với độ trễ nhẹ."
  },

  "macro_factors": [
    {
      "factor": "Lạm phát Mỹ",
      "status": "Thấp hơn dự kiến",
      "crypto_impact": "positive",
      "detail": "Dữ liệu CPI mới giúp tăng kỳ vọng Fed cắt giảm lãi suất sớm hơn."
    }
  ],

  "risk_signals": [
    {
      "signal": "Nguy cơ Long Squeeze",
      "severity": "medium",
      "source": "Dữ liệu phái sinh Binance"
    }
  ],

  "opportunities": [
    {
      "opportunity": "Mở lệnh Long tại hỗ trợ BTC 62k",
      "confidence": "medium",
      "basis": "Hỗ trợ kỹ thuật mạnh kết hợp tin tức vĩ mô tốt."
    }
  ],

  "market_snapshot": {
    "btc": {
      "price": "65230.50",
      "priceChangePercent": "4.2",
      "quoteVolume": "2500000000",
      "fundingRate": "0.0100",
      "openInterest": "480000",
      "longShortRatio": "1.25"
    },
    "eth": {
      "price": "3250.25",
      "priceChangePercent": "2.8",
      "quoteVolume": "1200000000",
      "fundingRate": "0.0080",
      "openInterest": "2200000",
      "longShortRatio": "1.15"
    },
    "snapshot_at": "2026-05-06T12:00:00Z"
  },

  "news_count": 1,
  "data_sources": ["CoinDesk", "Binance"],
  "note": "Bản tin được generate tự động từ hệ thống Analyst nội bộ."
}
```

## Example Usage (cURL)

```bash
curl -X POST http://localhost:3001/api/v1/analysis \
-H "Content-Type: application/json" \
-d '{...full_json_above...}'
```

## Response

Success (201 Created):
```json
{
  "message": "Analysis record created successfully",
  "data": {
    "_id": "663884...",
    ...
  }
}
```
