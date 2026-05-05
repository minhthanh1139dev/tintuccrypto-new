"use strict";

import axios from "axios";
import logger from "../../../shared/utils/logger.js";

/**
 * Fetch market data from Binance public APIs
 */
class BinanceService {
  constructor() {
    this.baseUrl = "https://api.binance.com/api/v3";
    this.fapiUrl = "https://fapi.binance.com/fapi/v1";
    this.futuresDataUrl = "https://fapi.binance.com/futures/data";
  }

  /**
   * Fetch BTC + ETH market data including derivatives metrics
   * @returns {Promise<{ BTC: Object, ETH: Object }>}
   */
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
}

export default new BinanceService();
