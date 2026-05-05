"use strict";

import logger from "../utils/logger.js";

/**
 * Fetch market data from Binance public APIs
 * 7 requests total, all public, no API key needed
 * Total weight: ~10/1200 per minute
 */
class BinanceService {
  async fetchMarketData() {
    logger.info("Fetching Binance market data...");

    const [tickerRes, btcFundingRes, ethFundingRes, btcOIRes, ethOIRes, btcLSRes, ethLSRes] =
      await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22%5D"),
        fetch("https://fapi.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1"),
        fetch("https://fapi.binance.com/fapi/v1/fundingRate?symbol=ETHUSDT&limit=1"),
        fetch("https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT"),
        fetch("https://fapi.binance.com/fapi/v1/openInterest?symbol=ETHUSDT"),
        fetch("https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1"),
        fetch("https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=ETHUSDT&period=1h&limit=1"),
      ]);

    const [tickers, btcFunding, ethFunding, btcOI, ethOI, btcLS, ethLS] = await Promise.all([
      tickerRes.json(),
      btcFundingRes.json(),
      ethFundingRes.json(),
      btcOIRes.json(),
      ethOIRes.json(),
      btcLSRes.json(),
      ethLSRes.json(),
    ]);

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
  }
}

export default new BinanceService();
