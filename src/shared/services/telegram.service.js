"use strict";

import TelegramBot from "node-telegram-bot-api";
import logger from "../utils/logger.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSentimentEmoji(sentiment, score) {
  if (sentiment === "bullish") return score > 0.5 ? "🟢🔥" : "🟢";
  if (sentiment === "bearish") return score < -0.5 ? "🔴💀" : "🔴";
  return "🟡";
}

function getImpactEmoji(impact) {
  return { high: "🔴", medium: "🟡", low: "🟢" }[impact] || "⚪";
}

function getSeverityEmoji(severity) {
  return { high: "🚨", medium: "⚠️", low: "💡" }[severity] || "ℹ️";
}

function formatPrice(val) {
  return Number(val).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatPercent(val) {
  const n = parseFloat(val);
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

// ── Message Builder ──────────────────────────────────────────────────────────

/**
 * Build Telegram message from analysis object
 * @param {Object} analysis - CryptoAnalysis document
 * @returns {string}
 */
function buildTelegramMessage(analysis) {
  const snapshot = analysis.market_snapshot || {};
  const BTC = snapshot.btc || {};
  const ETH = snapshot.eth || {};
  const sentimentEmoji = getSentimentEmoji(
    analysis.overall_sentiment,
    analysis.sentiment_score,
  );
  const now = new Date(analysis.analyzed_at).toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  let msg = "";

  // ── Header
  msg += `📊 *PHÂN TÍCH THỊ TRƯỜNG CRYPTO*\n`;
  msg += `🕐 ${now} (ICT) | ${sentimentEmoji} *${analysis.overall_sentiment.toUpperCase()}*\n`;
  if (analysis.confidence) {
    const confEmoji = { high: "✅", medium: "⚖️", low: "❓" }[
      analysis.confidence
    ];
    msg += `🎯 Độ tin cậy: ${confEmoji} ${analysis.confidence.toUpperCase()}\n`;
  }
  msg += `${"─".repeat(30)}\n\n`;

  // ── Giá thị trường
  if (BTC.price && ETH.price) {
    msg += `💰 *GIÁ HIỆN TẠI*\n`;
    msg += `• BTC: $${formatPrice(BTC.price)} (${formatPercent(
      BTC.priceChangePercent,
    )})\n`;
    msg += `• ETH: $${formatPrice(ETH.price)} (${formatPercent(
      ETH.priceChangePercent,
    )})\n`;
    msg += `• BTC Funding: ${BTC.fundingRate}% | L/S: ${BTC.longShortRatio}\n`;
    msg += `• ETH Funding: ${ETH.fundingRate}% | L/S: ${ETH.longShortRatio}\n\n`;
  }

  // ── Mức giá quan trọng
  if (analysis.key_price_levels) {
    msg += `📈 *MỨC GIÁ QUAN TRỌNG*\n`;
    const btcLv = analysis.key_price_levels.btc || {};
    const ethLv = analysis.key_price_levels.eth || {};

    msg += `🔸 *BTC*: ${btcLv.technical_bias?.toUpperCase() || "N/A"}\n`;
    msg += `   - Kháng cự: ${(btcLv.key_resistance || []).join(", ")}\n`;
    msg += `   - Hỗ trợ: ${(btcLv.key_support || []).join(", ")}\n`;

    msg += `🔸 *ETH*: ${ethLv.technical_bias?.toUpperCase() || "N/A"}\n`;
    msg += `   - Kháng cự: ${(ethLv.key_resistance || []).join(", ")}\n`;
    msg += `   - Hỗ trợ: ${(ethLv.key_support || []).join(", ")}\n\n`;
  }

  // ── Tóm tắt
  msg += `📝 *TÓM TẮT*\n`;
  msg += `${analysis.market_summary}\n\n`;

  // ── Tin tức nổi bật
  const topNews = (analysis.news || [])
    .filter((n) => n.impact === "high" || n.impact === "medium")
    .slice(0, 3);

  if (topNews.length > 0) {
    msg += `📰 *TIN TỨC NỔI BẬT (${analysis.news_count} tin)*\n`;
    topNews.forEach((n, i) => {
      const emoji = getImpactEmoji(n.impact);
      msg += `${emoji} ${n.title_vi || n.title}\n`;
      if (n.summary_vi) msg += `   _${n.summary_vi}_\n`;
      // if (n.url && n.url.startsWith("http")) {
      //   msg += `   🔗 [Chi tiết](${n.url}) | 📌 ${n.source || "Nguồn"}\n`;
      // } else if (n.source) {
      if (n.source) {
        msg += `   📌 ${n.source}\n`;
      }
      if (i < topNews.length - 1) msg += "\n";
    });
    msg += "\n";
  }

  // ── Ghi chú/Note
  if (analysis.note) {
    msg += `💡 *LƯU Ý*\n`;
    msg += `_${analysis.note}_\n\n`;
  }

  // ── Rủi ro/Cơ hội (gộp lại cho ngắn)
  const highRisks = (analysis.risk_signals || [])
    .filter((r) => r.severity === "high")
    .slice(0, 1);
  const highOpps = (analysis.opportunities || [])
    .filter((o) => o.confidence === "high")
    .slice(0, 1);

  if (highRisks.length > 0 || highOpps.length > 0) {
    msg += `🎯 *TỔM LƯỢC*\n`;
    highRisks.forEach((r) => (msg += `🚨 Rủi ro: ${r.signal}\n`));
    highOpps.forEach((o) => (msg += `💎 Cơ hội: ${o.opportunity}\n`));
    msg += "\n";
  }

  // ── Footer
  msg += `${"─".repeat(30)}\n`;
  msg += `🤖 _Phân tích tự động bởi AI (${process.env.AI_PROVIDER || "gemini"})_\n`;
  msg += `📈 _Không phải khuyến nghị đầu tư_`;

  return msg;
}

// ── Telegram Service ─────────────────────────────────────────────────────────

let bot = null;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

if (process.env.TELEGRAM_BOT_TOKEN) {
  bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  logger.info("Telegram bot initialized");
} else {
  logger.warn("TELEGRAM_BOT_TOKEN is not defined — Telegram disabled");
}

class TelegramService {
  async sendAnalysis(analysis) {
    if (!bot) return;

    const message = buildTelegramMessage(analysis);

    await bot.sendMessage(channelId, message, {
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });

    logger.info(
      {
        sentiment: analysis.overall_sentiment,
        score: analysis.sentiment_score,
      },
      "Telegram analysis sent",
    );
  }

  async sendAlert(title, detail, severity = "high") {
    if (!bot) return;

    const emoji = { high: "🚨", medium: "⚠️", low: "💡" }[severity];
    const now = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const msg = `${emoji} *ALERT: ${title}*\n\n${detail}\n\n_${now}_`;

    await bot.sendMessage(channelId, msg, { parse_mode: "Markdown" });
    logger.info({ title, severity }, "Telegram alert sent");
  }

  async checkAndSendAlerts(marketData) {
    const { BTC, ETH } = marketData;
    const alerts = [];

    if (Math.abs(parseFloat(BTC.fundingRate)) > 0.1) {
      alerts.push({
        title: "BTC Funding Rate bất thường",
        detail: `Funding rate BTC đang ở mức *${BTC.fundingRate}%* — vượt ngưỡng cảnh báo 0.1%.\nĐây là dấu hiệu thị trường đang bị thiên lệch mạnh, rủi ro squeeze cao.`,
        severity: "high",
      });
    }

    if (Math.abs(parseFloat(BTC.priceChangePercent)) > 5) {
      const dir =
        parseFloat(BTC.priceChangePercent) > 0 ? "tăng 🚀" : "giảm 📉";
      alerts.push({
        title: `BTC ${dir} mạnh`,
        detail: `Bitcoin đã ${dir} *${formatPercent(
          BTC.priceChangePercent,
        )}* trong 24 giờ qua.\nGiá hiện tại: *$${formatPrice(BTC.price)}*`,
        severity:
          Math.abs(parseFloat(BTC.priceChangePercent)) > 10 ? "high" : "medium",
      });
    }

    if (parseFloat(BTC.longShortRatio) > 2.5) {
      alerts.push({
        title: "BTC Long/Short Ratio cực đoan",
        detail: `Tỷ lệ long/short BTC đang ở *${BTC.longShortRatio}* — quá nhiều người đang long.\nKhả năng long squeeze rất cao nếu giá đảo chiều.`,
        severity: "high",
      });
    }

    for (const alert of alerts) {
      await this.sendAlert(alert.title, alert.detail, alert.severity);
      await new Promise((r) => setTimeout(r, 1000));
    }

    return alerts.length;
  }
}

export default new TelegramService();
