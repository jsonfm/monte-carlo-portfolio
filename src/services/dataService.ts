import type { HistoricalPrice, AssetType } from '@/types';

// Standard fallback assets if users don't know what to put
export const PRESET_ASSETS = [
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'etf' as AssetType, weight: 40 },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', type: 'etf' as AssetType, weight: 30 },
  { ticker: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'bond' as AssetType, weight: 20 },
  { ticker: 'BTC-USD', name: 'Bitcoin USD', type: 'crypto' as AssetType, weight: 10 },
];

export const PRESET_BENCHMARKS = [
  { ticker: 'SPY', name: 'S&P 500 Index (SPY)' },
  { ticker: 'QQQ', name: 'Nasdaq 100 Index (QQQ)' },
  { ticker: 'IWM', name: 'Russell 2000 Index (IWM)' },
  { ticker: 'BTC-USD', name: 'Bitcoin (BTC)' },
];

// Robust proxy list for CORS bypass on client side
const PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Fetches historical price data from Yahoo Finance via CORS proxies
 */
export async function fetchHistoricalData(
  ticker: string,
  range: string = '5y'
): Promise<HistoricalPrice[]> {
  const cleanTicker = ticker.trim().toUpperCase();
  // Yahoo Finance chart endpoint
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}?range=${range}&interval=1d`;

  let lastError: Error | null = null;

  // Try each proxy in sequence
  for (const proxyFn of PROXIES) {
    try {
      const proxiedUrl = proxyFn(yahooUrl);
      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      
      if (json.chart?.error) {
        throw new Error(json.chart.error.description || 'Yahoo Finance API Error');
      }

      const result = json.chart?.result?.[0];
      if (!result) {
        throw new Error('No historical data found for this ticker');
      }

      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0]?.close || [];
      const adjCloses = result.indicators?.adjclose?.[0]?.adjclose || quotes; // Fallback to close if adjclose doesn't exist

      if (timestamps.length === 0) {
        throw new Error('No price timestamps returned');
      }

      const historicalPrices: HistoricalPrice[] = [];

      for (let i = 0; i < timestamps.length; i++) {
        const date = new Date(timestamps[i] * 1000);
        // Format to YYYY-MM-DD in UTC to avoid timezone issues
        const yyyy = date.getUTCFullYear();
        const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(date.getUTCDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        const price = adjCloses[i];
        
        // Skip null/undefined prices
        if (price !== null && price !== undefined && !isNaN(price)) {
          historicalPrices.push({
            date: dateStr,
            price: price,
          });
        }
      }

      if (historicalPrices.length === 0) {
        throw new Error('No valid price points after parsing');
      }

      // Sort by date ascending
      return historicalPrices.sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.warn(`Proxy failed for ${cleanTicker} with Yahoo Finance:`, errMessage);
      lastError = err instanceof Error ? err : new Error(errMessage);
    }
  }

  throw lastError || new Error(`Failed to fetch data for ${ticker}`);
}

/**
 * Merges historical price time series from multiple assets, matching dates
 */
export function alignHistoricalData(
  assetsData: { ticker: string; prices: HistoricalPrice[] }[]
): { dates: string[]; alignedPrices: { [ticker: string]: number }[] } {
  if (assetsData.length === 0) return { dates: [], alignedPrices: [] };

  // Find all unique dates across all assets
  const dateSet = new Set<string>();
  assetsData.forEach(asset => {
    asset.prices.forEach(p => dateSet.add(p.date));
  });

  const sortedDates = Array.from(dateSet).sort();

  // Create a map for fast lookup: ticker -> date -> price
  const priceMapByAsset: { [ticker: string]: { [date: string]: number } } = {};
  assetsData.forEach(asset => {
    priceMapByAsset[asset.ticker] = {};
    asset.prices.forEach(p => {
      priceMapByAsset[asset.ticker][p.date] = p.price;
    });
  });

  // Aligned prices array
  const alignedPrices: { [ticker: string]: number }[] = [];
  const datesWithFullData: string[] = [];

  // For each date, ensure we can either find the price or backfill/forward-fill it.
  // In portfolio analytics, if a price is missing on a date, we forward-fill from the last available price.
  const lastKnownPrice: { [ticker: string]: number } = {};

  sortedDates.forEach(date => {
    let hasAllDataThisDate = true;
    const rowPrices: { [ticker: string]: number } = {};

    assetsData.forEach(asset => {
      const price = priceMapByAsset[asset.ticker][date];
      if (price !== undefined) {
        rowPrices[asset.ticker] = price;
        lastKnownPrice[asset.ticker] = price;
      } else if (lastKnownPrice[asset.ticker] !== undefined) {
        // Forward fill
        rowPrices[asset.ticker] = lastKnownPrice[asset.ticker];
      } else {
        // No price has been recorded yet for this asset (can happen if asset started trading later)
        hasAllDataThisDate = false;
      }
    });

    // Only include rows where we have prices for ALL assets
    if (hasAllDataThisDate) {
      datesWithFullData.push(date);
      alignedPrices.push(rowPrices);
    }
  });

  return {
    dates: datesWithFullData,
    alignedPrices: alignedPrices,
  };
}

/**
 * Search assets using Yahoo Finance API
 */
export async function searchAssetsAPI(query: string): Promise<{ ticker: string; name: string; type: AssetType }[]> {
  if (!query) return [];
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=5&newsCount=0`;
  
  for (const proxyFn of PROXIES) {
    try {
      const response = await fetch(proxyFn(url));
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      interface YahooQuote {
        symbol: string;
        quoteType: string;
        shortname?: string;
        longname?: string;
      }
      return (data.quotes || []).map((q: YahooQuote) => {
        let type: AssetType = 'stock';
        if (q.quoteType === 'ETF') type = 'etf';
        else if (q.quoteType === 'CRYPTOCURRENCY') type = 'crypto';
        else if (q.quoteType === 'MUTUALFUND') type = 'bond';
        
        return {
          ticker: q.symbol,
          name: q.shortname || q.longname || q.symbol,
          type
        };
      }).filter((a: { ticker: string; name: string }) => a.ticker && a.name);
    } catch (err) {
      console.warn('Search proxy failed', err);
    }
  }
  return [];
}
