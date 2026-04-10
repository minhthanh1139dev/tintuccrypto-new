"use strict";

import axios from "axios";
import logger from "./logger.js";
import config from "../../config/app.config.js";
import ApiCallLog from "../../models/apiCallLog.model.js";

// ── Pricing per 1M tokens (USD) ─────────────────────────────────────────────
// Free-text provider/model → no enum lock.
// Call aiClient.setPricing("new-model", inputPer1M, outputPer1M) to extend.
const PRICING = {
  // xAI / Grok
  "grok-3":                       { input: 3.00,  output: 15.00 },
  "grok-3-mini":                  { input: 0.30,  output: 0.50  },
  // OpenAI
  "gpt-4o":                       { input: 2.50,  output: 10.00 },
  "gpt-4o-mini":                  { input: 0.15,  output: 0.60  },
  "gpt-4.1":                      { input: 2.00,  output: 8.00  },
  "gpt-4.1-mini":                 { input: 0.40,  output: 1.60  },
  "gpt-4.1-nano":                 { input: 0.10,  output: 0.40  },
  // Anthropic
  "claude-sonnet-4-20250514":     { input: 3.00,  output: 15.00 },
  "claude-haiku-4-20250514":      { input: 0.80,  output: 4.00  },
  // Perplexity
  "sonar":                        { input: 1.00,  output: 1.00  },
  "sonar-pro":                    { input: 3.00,  output: 15.00 },
  "sonar-reasoning":              { input: 1.00,  output: 5.00  },
  "sonar-reasoning-pro":          { input: 2.00,  output: 8.00  },
};

// ── Retry helpers ────────────────────────────────────────────────────────────

const RETRYABLE_CODES = new Set([408, 429, 500, 502, 503, 504]);

async function withRetry(fn, maxRetries, baseDelayMs = 1000) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err.response?.status;
      if ((status && !RETRYABLE_CODES.has(status)) || attempt === maxRetries) throw err;

      const delay = baseDelayMs * 2 ** attempt + Math.random() * 500;
      logger.warn({ attempt: attempt + 1, maxRetries, status, delayMs: Math.round(delay) }, "ai call retrying");
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ── Provider adapters ────────────────────────────────────────────────────────
// Each adapter: (providerCfg, params) → { content, tokensInput, tokensOutput, searchCalls, citations, raw }

function resolveProviderConfig(provider) {
  const cfg = config.ai?.providers?.[provider];
  if (!cfg?.apiKey) throw new Error(`AI provider "${provider}" not configured — set API key in env`);
  return cfg;
}

async function openaiCompatible(cfg, p) {
  const { data } = await axios.post(
    `${cfg.baseUrl}/chat/completions`,
    { model: p.model, messages: p.messages, temperature: p.temperature, max_tokens: p.maxTokens, ...p.extra },
    { headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" }, timeout: p.timeoutMs },
  );
  return {
    content: data.choices?.[0]?.message?.content || "",
    tokensInput: data.usage?.prompt_tokens || 0,
    tokensOutput: data.usage?.completion_tokens || 0,
    searchCalls: data.usage?.search_calls || 0,
    citations: data.citations || [],
    raw: data,
  };
}

async function anthropicAdapter(cfg, p) {
  const body = { model: p.model, max_tokens: p.maxTokens, temperature: p.temperature, ...p.extra };
  if (p.systemPrompt) body.system = p.systemPrompt;
  body.messages = p.messages.filter((m) => m.role !== "system");

  const { data } = await axios.post(
    `${cfg.baseUrl}/v1/messages`,
    body,
    {
      headers: { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      timeout: p.timeoutMs,
    },
  );
  return {
    content: data.content?.find((b) => b.type === "text")?.text || "",
    tokensInput: data.usage?.input_tokens || 0,
    tokensOutput: data.usage?.output_tokens || 0,
    searchCalls: 0,
    citations: [],
    raw: data,
  };
}

const adapters = {
  grok: openaiCompatible,
  openai: openaiCompatible,
  perplexity: openaiCompatible,
  anthropic: anthropicAdapter,
};

// ── Cost calculation ─────────────────────────────────────────────────────────

function calcCost(model, tokensIn, tokensOut, searchCalls) {
  const p = PRICING[model];
  if (!p) return { costTokens: 0, costSearch: 0, costTotal: 0 };

  const costTokens = (tokensIn / 1e6) * p.input + (tokensOut / 1e6) * p.output;
  const costSearch = searchCalls * 0.005; // ~$5 / 1k searches (Perplexity)
  const costTotal = costTokens + costSearch;
  const round = (n) => Math.round(n * 1e6) / 1e6;
  return { costTokens: round(costTokens), costSearch: round(costSearch), costTotal: round(costTotal) };
}

// ── AIClient ─────────────────────────────────────────────────────────────────

class AIClient {
  /**
   * Send a chat completion request to any registered AI provider.
   *
   * @param {Object}  opts
   * @param {string}  opts.provider        "grok" | "openai" | "anthropic" | "perplexity" | custom
   * @param {string}  opts.model           Model identifier
   * @param {Array}   opts.messages        [{ role, content }]
   * @param {string}  [opts.systemPrompt]  Prepended as system message (Anthropic: sent via `system` field)
   * @param {string}  opts.callType        Logging category (matches ApiCallLog.callType enum)
   * @param {string}  [opts.region]        "global" | "vietnam" | "asia"
   * @param {number}  [opts.temperature]
   * @param {number}  [opts.maxTokens]
   * @param {number}  [opts.timeoutMs]
   * @param {number}  [opts.maxRetries]
   * @param {Object}  [opts.extra]         Extra body params forwarded to provider
   * @param {boolean} [opts.skipLog=false]  Skip writing to ApiCallLog
   *
   * @returns {Promise<{
   *   content: string,
   *   tokensInput: number,
   *   tokensOutput: number,
   *   searchCalls: number,
   *   durationMs: number,
   *   costTokens: number,
   *   costSearch: number,
   *   costTotal: number,
   *   logId: import("mongoose").Types.ObjectId | undefined,
   *   citations: string[],
   *   raw: Object
   * }>}
   */
  async chat(opts) {
    const {
      provider,
      model,
      messages: rawMessages,
      systemPrompt,
      callType,
      region,
      temperature = config.ai?.defaults?.temperature ?? 0.7,
      maxTokens   = config.ai?.defaults?.maxTokens ?? 4096,
      timeoutMs   = config.ai?.defaults?.timeoutMs ?? 120_000,
      maxRetries   = config.ai?.defaults?.maxRetries ?? 3,
      extra = {},
      skipLog = false,
    } = opts;

    if (!provider) throw new Error("provider is required");
    if (!model)    throw new Error("model is required");
    if (!callType) throw new Error("callType is required");

    const adapter = adapters[provider];
    if (!adapter) throw new Error(`Unknown provider "${provider}". Use aiClient.registerProvider() to add it.`);

    const providerCfg = resolveProviderConfig(provider);

    let messages = [...(rawMessages || [])];
    if (systemPrompt && provider !== "anthropic") {
      messages = [{ role: "system", content: systemPrompt }, ...messages];
    }

    const start = Date.now();
    let result, logStatus = "success", errorMessage;

    try {
      result = await withRetry(
        () => adapter(providerCfg, { model, messages, temperature, maxTokens, timeoutMs, systemPrompt, extra }),
        maxRetries,
      );
    } catch (err) {
      logStatus = "failed";
      errorMessage = err.response?.data?.error?.message || err.message;

      if (!skipLog) {
        await this._log({ provider, model, callType, region, durationMs: Date.now() - start, status: logStatus, errorMessage })
          .catch((e) => logger.error({ err: e }, "failed to save api call log"));
      }
      throw err;
    }

    const durationMs = Date.now() - start;
    const costs = calcCost(model, result.tokensInput, result.tokensOutput, result.searchCalls);

    let logId;
    if (!skipLog) {
      try {
        const log = await this._log({
          provider, model, callType, region,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
          searchCalls: result.searchCalls,
          ...costs, durationMs, status: logStatus,
        });
        logId = log._id;
      } catch (e) {
        logger.error({ err: e }, "failed to save api call log");
      }
    }

    logger.info(
      { provider, model, callType, tokensIn: result.tokensInput, tokensOut: result.tokensOutput, durationMs, cost: costs.costTotal },
      "ai call done",
    );

    return {
      content: result.content,
      tokensInput: result.tokensInput,
      tokensOutput: result.tokensOutput,
      searchCalls: result.searchCalls,
      durationMs,
      ...costs,
      logId,
      citations: result.citations,
      raw: result.raw,
    };
  }

  /**
   * Link a completed log entry to its produced result (digest, deep_analysis, etc.)
   */
  async linkResult(logId, resultType, resultId) {
    if (!logId) return;
    return ApiCallLog.findByIdAndUpdate(logId, { resultType, resultId });
  }

  /**
   * Register a custom provider adapter.
   * Adapter signature: async (providerCfg, { model, messages, temperature, maxTokens, timeoutMs, systemPrompt, extra })
   *   → { content, tokensInput, tokensOutput, searchCalls, citations, raw }
   */
  registerProvider(name, adapterFn) {
    if (typeof adapterFn !== "function") throw new Error("adapter must be a function");
    adapters[name] = adapterFn;
    logger.info({ provider: name }, "ai provider registered");
  }

  /** Add or update pricing for a model (per 1M tokens, USD). */
  setPricing(model, inputPer1M, outputPer1M) {
    PRICING[model] = { input: inputPer1M, output: outputPer1M };
  }

  /** Get a copy of the current pricing table. */
  getPricing() {
    return { ...PRICING };
  }

  async _log(data) {
    return ApiCallLog.create(data);
  }
}

const aiClient = new AIClient();

export default aiClient;
