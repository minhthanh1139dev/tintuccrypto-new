"use strict";

import logger from "../utils/logger.js";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// Build headers — key is optional (free tier still works, but with rate limit)
function buildHeaders() {
  const headers = { accept: "application/json" };
  if (process.env.COINGECKO_API_KEY) {
    headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
  }
  return headers;
}

class CoinGeckoService {
  /**
   * Fetch top N coins by market cap with price, 24h change, volume
   * @param {number} limit - number of coins (default 50)
   * @param {string} currency - vs_currency (default "usd")
   */
  async getTopCoins(limit = 50, currency = "usd") {
    const url = new URL(`${COINGECKO_BASE}/coins/markets`);
    url.searchParams.set("vs_currency", currency);
    url.searchParams.set("order", "market_cap_desc");
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("page", "1");
    url.searchParams.set("sparkline", "false");
    url.searchParams.set(
      "price_change_percentage",
      "1h,24h,7d"
    );

    const res = await fetch(url.toString(), { headers: buildHeaders() });

    if (!res.ok) {
      const text = await res.text();
      logger.error({ status: res.status, body: text }, "CoinGecko API error");
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const data = await res.json();

    return data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      image: coin.image,
      price: coin.current_price,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      volume_24h: coin.total_volume,
      change_1h: coin.price_change_percentage_1h_in_currency ?? null,
      change_24h: coin.price_change_percentage_24h_in_currency ?? null,
      change_7d: coin.price_change_percentage_7d_in_currency ?? null,
      ath: coin.ath,
      ath_change_percentage: coin.ath_change_percentage,
      last_updated: coin.last_updated,
    }));
  }

  /**
   * Fetch a single coin's detail
   * @param {string} coinId - e.g. "bitcoin", "ethereum"
   */
  async getCoinDetail(coinId) {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
      { headers: buildHeaders() }
    );

    if (!res.ok) {
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    const coin = await res.json();

    return {
      id: coin.id,
      symbol: coin.symbol?.toUpperCase(),
      name: coin.name,
      image: coin.image?.large,
      description: coin.description?.en?.slice(0, 500) || "",
      price: coin.market_data?.current_price?.usd,
      market_cap: coin.market_data?.market_cap?.usd,
      volume_24h: coin.market_data?.total_volume?.usd,
      change_24h: coin.market_data?.price_change_percentage_24h,
      change_7d: coin.market_data?.price_change_percentage_7d,
      ath: coin.market_data?.ath?.usd,
      last_updated: coin.last_updated,
    };
  }

  /**
   * Simple global market overview (total cap, BTC dominance, fear index)
   */
  async getGlobalStats() {
    const res = await fetch(`${COINGECKO_BASE}/global`, {
      headers: buildHeaders(),
    });

    if (!res.ok) {
      throw new Error(`CoinGecko global stats error: ${res.status}`);
    }

    const { data } = await res.json();

    return {
      total_market_cap_usd: data.total_market_cap?.usd,
      total_volume_24h_usd: data.total_volume?.usd,
      btc_dominance: data.market_cap_percentage?.btc?.toFixed(2),
      eth_dominance: data.market_cap_percentage?.eth?.toFixed(2),
      active_cryptocurrencies: data.active_cryptocurrencies,
      market_cap_change_24h: data.market_cap_change_percentage_24h_usd?.toFixed(2),
    };
  }
}

export default new CoinGeckoService();
