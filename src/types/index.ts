export type AssetType = 'stock' | 'etf' | 'bond' | 'crypto';

export interface Asset {
  ticker: string;
  name: string;
  weight: number; // percentage, e.g., 20 for 20%
  type: AssetType;
}

export interface HistoricalPrice {
  date: string; // YYYY-MM-DD
  price: number;
}

export interface AssetHistory {
  ticker: string;
  prices: HistoricalPrice[];
  returns: number[]; // Daily percentage returns
  cagr: number;
  volatility: number;
}

export type HistoricalRange = '1y' | '3y' | '5y' | '10y';

export interface PortfolioConfig {
  assets: Asset[];
  initialInvestment: number;
  horizonYears: number;
  simulationsCount: number;
  model: 'gbm' | 'bootstrap';
  benchmarkTicker: string;
  rebalanceFrequency: 'none' | 'monthly' | 'annually';
}

export interface PercentilePath {
  year: number;
  value: number;
}

export interface SimulationSummary {
  percentiles: {
    p10: PercentilePath[];
    p25: PercentilePath[];
    p50: PercentilePath[];
    p75: PercentilePath[];
    p90: PercentilePath[];
  };
  samplePaths: number[][]; // Subset of actual raw simulated paths (e.g., 20-50 paths) for visual rendering
  finalValues: number[]; // Sorted array of all simulated end values
  metrics: {
    initialValue: number;
    medianFinalValue: number;
    expectedCagr: number;
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
    valueAtRisk95: number; // 95% Value at Risk
    conditionalValueAtRisk95: number; // 95% CVaR (Expected Shortfall)
    probabilityOfLoss: number; // Probability of ending below initial investment
    probabilityOfTarget: number; // Probability of beating a target or doubling
  };
}

export interface HistoricalMetrics {
  dates: string[];
  portfolioPrices: number[];
  portfolioReturns: number[];
  benchmarkPrices: number[];
  benchmarkReturns: number[];
  metrics: {
    portfolio: SingleAssetMetrics;
    benchmark: SingleAssetMetrics;
    correlation: number;
    beta: number;
    alpha: number;
  };
}

export interface SingleAssetMetrics {
  cagr: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
}
