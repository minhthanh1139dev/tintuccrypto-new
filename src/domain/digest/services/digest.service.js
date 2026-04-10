"use strict";

import logger from "../../../shared/utils/logger.js";
import aiClient from "../../../shared/utils/aiClient.js";
import { AppError } from "../../../shared/middlewares/errorHandler.middleware.js";
import digestRepository from "../repositories/digest.repository.js";
import newsRepository from "../../news/repositories/news.repository.js";
import { DIGEST_CODES } from "../constants/digest.codes.js";

// ── Slug helpers ─────────────────────────────────────────────────────────────

function pad(n) {
  return String(n).padStart(2, "0");
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function buildSlug(type, region, periodStart) {
  const d = periodStart;
  const base = `${type}-${region}`;
  switch (type) {
    case "4h":
      return `${base}-${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}-${pad(d.getUTCHours())}`;
    case "daily":
      return `${base}-${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    case "weekly":
      return `${base}-${d.getUTCFullYear()}-w${pad(isoWeek(d))}`;
    case "monthly":
      return `${base}-${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
    case "quarterly": {
      const q = Math.ceil((d.getUTCMonth() + 1) / 3);
      return `${base}-${d.getUTCFullYear()}-q${q}`;
    }
    case "yearly":
      return `${base}-${d.getUTCFullYear()}`;
    default:
      return `${base}-${d.toISOString()}`;
  }
}

// ── Period calculation ───────────────────────────────────────────────────────

function calculatePeriod(type) {
  const now = new Date();
  let periodStart, periodEnd;

  switch (type) {
    case "4h": {
      const slot = Math.floor(now.getUTCHours() / 4) * 4;
      periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), slot));
      periodEnd = new Date(periodStart.getTime() + 4 * 60 * 60 * 1000 - 1);
      break;
    }
    case "daily": {
      periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      break;
    }
    case "weekly": {
      const day = now.getUTCDay() || 7;
      periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1));
      periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      break;
    }
    case "monthly": {
      periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      break;
    }
    default:
      throw new Error(`Unsupported digest type: ${type}`);
  }
  return { periodStart, periodEnd };
}

// ── AI prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a professional crypto market analyst. Your job is to scan the latest cryptocurrency and blockchain news, then produce a structured JSON digest.

RULES:
- Focus on REAL, VERIFIED news only. Never fabricate events.
- Each news item must include source attribution.
- Sentiment must be data-driven, not speculative.
- Impact score 1-10 based on market significance.
- Always respond with valid JSON matching the schema below. No markdown, no extra text.

RESPONSE SCHEMA:
{
  "headline": "One-sentence summary of the period",
  "headline_vi": "Vietnamese translation",
  "overview": "3-5 sentence overview",
  "overview_vi": "Vietnamese translation",
  "key_themes": ["theme1", "theme2"],
  "top_narratives": ["narrative1", "narrative2"],
  "market_snapshot": {
    "market_trend": "bullish|bearish|sideways",
    "btc_dominance": 58.5,
    "total_market_cap": "$2.1T"
  },
  "news_items": [
    {
      "title": "English title",
      "title_vi": "Vietnamese title",
      "summary": "2-4 sentence summary",
      "summary_vi": "Vietnamese summary",
      "source_url": "https://...",
      "source_name": "CoinDesk",
      "source_type": "web",
      "region": "global|vietnam|asia",
      "category": "market|macro|regulation|defi|exchange|project|nft_gaming|vietnam",
      "tags": ["BTC", "ETH"],
      "coins": ["BTC"],
      "narratives": ["AI coins"],
      "sentiment": "bullish|bearish|neutral",
      "impact": "high|medium|low",
      "impact_score": 8,
      "credibility": "high|medium|low",
      "is_featured": false
    }
  ]
}`;

function buildUserPrompt(type, region, periodStart, periodEnd) {
  const regionLabel = region === "vietnam" ? "Vietnam crypto market" : "global crypto market";
  const timeRange = `${periodStart.toISOString()} to ${periodEnd.toISOString()}`;

  return `Scan and analyze the latest ${regionLabel} news for the period: ${timeRange}.

Provide:
1. 10-20 most important news items sorted by impact
2. Overall market digest with headline, overview, key themes
3. Market snapshot (trend, BTC dominance, total market cap)
4. Focus on: price movements, regulation changes, major project updates, DeFi, macro events
${region === "vietnam" ? "5. Include Vietnam-specific crypto news, policy changes, and local exchange updates" : ""}

Return ONLY valid JSON matching the schema.`;
}

// ── Service ──────────────────────────────────────────────────────────────────

class DigestService {
  async getById(id) {
    const digest = await digestRepository.findById(id);
    if (!digest) throw new AppError(DIGEST_CODES.DIGEST_NOT_FOUND, 404);
    return digest;
  }

  async getBySlug(slug) {
    const digest = await digestRepository.findBySlug(slug);
    if (!digest) throw new AppError(DIGEST_CODES.DIGEST_NOT_FOUND, 404);
    return digest;
  }

  async getLatest(type, region = "global") {
    const digest = await digestRepository.findLatestByType(type, region);
    if (!digest) throw new AppError(DIGEST_CODES.DIGEST_NOT_FOUND, 404);
    return digest;
  }

  async list({ page, limit, type, region, status = "published" }) {
    const filters = { status };
    if (type) filters.type = type;
    if (region) filters.region = region;

    return digestRepository.findAll({
      filters,
      sort: { periodEnd: -1 },
      paginator: { page, limit },
    });
  }

  /**
   * Generate a digest by calling AI.
   * This is the core method used by cron jobs.
   */
  async generate({ type, region = "global", provider = "grok", model = "grok-3" }) {
    const { periodStart, periodEnd } = calculatePeriod(type);
    const slug = buildSlug(type, region, periodStart);

    const existing = await digestRepository.existsForPeriod(type, region, periodStart, periodEnd);
    if (existing) {
      logger.warn({ type, region, slug }, "digest already exists for period, skipping");
      return null;
    }

    const callType = type === "4h" ? "4h_digest" : `${type}_digest`;

    let aiResult;
    try {
      aiResult = await aiClient.chat({
        provider,
        model,
        callType,
        region,
        systemPrompt: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(type, region, periodStart, periodEnd) }],
      });
    } catch (err) {
      logger.error({ err: err.message, type, region }, "AI call failed for digest generation");
      throw new AppError(DIGEST_CODES.DIGEST_GENERATION_FAILED, 500);
    }

    let parsed;
    try {
      const cleaned = aiResult.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      logger.error({ raw: aiResult.content.slice(0, 500) }, "failed to parse AI JSON response");
      throw new AppError(DIGEST_CODES.DIGEST_AI_PARSE_ERROR, 500);
    }

    // Save news items
    const newsItems = (parsed.news_items || []).map((item) => ({
      title: item.title,
      titleVi: item.title_vi,
      summary: item.summary,
      summaryVi: item.summary_vi,
      sourceUrl: item.source_url,
      sourceName: item.source_name,
      sourceType: item.source_type || "web",
      publishedAt: new Date(),
      region: item.region || region,
      category: item.category || "market",
      tags: item.tags || [],
      coins: item.coins || [],
      narratives: item.narratives || [],
      sentiment: item.sentiment,
      impact: item.impact,
      impactScore: item.impact_score,
      credibility: item.credibility || "medium",
      status: "published",
      isFeatured: item.is_featured || false,
      apiCallId: aiResult.logId,
    }));

    const savedNews = await newsRepository.createMany(newsItems);
    const savedCount = Array.isArray(savedNews) ? savedNews.length : 0;

    // Build stats from saved news
    const stats = {
      totalItems: savedCount,
      highImpact: newsItems.filter((n) => n.impact === "high").length,
      bullishCount: newsItems.filter((n) => n.sentiment === "bullish").length,
      bearishCount: newsItems.filter((n) => n.sentiment === "bearish").length,
      neutralCount: newsItems.filter((n) => n.sentiment === "neutral").length,
      topCoins: parsed.market_snapshot?.top_coins || this._topCoins(newsItems),
    };

    const marketSnapshot = parsed.market_snapshot
      ? {
          marketTrend: parsed.market_snapshot.market_trend,
          btcDominance: parsed.market_snapshot.btc_dominance,
          totalMarketCap: parsed.market_snapshot.total_market_cap,
        }
      : undefined;

    const digest = await digestRepository.create({
      type,
      slug,
      periodStart,
      periodEnd,
      region,
      headline: parsed.headline,
      headlineVi: parsed.headline_vi,
      overview: parsed.overview,
      overviewVi: parsed.overview_vi,
      keyThemes: parsed.key_themes || [],
      topNarratives: parsed.top_narratives || [],
      stats,
      marketSnapshot,
      status: "published",
      modelUsed: model,
      apiCallId: aiResult.logId,
    });

    await aiClient.linkResult(aiResult.logId, "digest", digest._id);

    logger.info(
      { digestId: digest._id, slug, newsCount: savedCount, cost: aiResult.costTotal },
      "digest generated",
    );

    return digest;
  }

  /** Extract top 5 most mentioned coins from news items */
  _topCoins(items) {
    const freq = {};
    for (const item of items) {
      for (const coin of item.coins || []) {
        freq[coin] = (freq[coin] || 0) + 1;
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([coin]) => coin);
  }
}

export default new DigestService();
