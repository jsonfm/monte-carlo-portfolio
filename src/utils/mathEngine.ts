import type { SingleAssetMetrics, HistoricalMetrics } from '../types';

/**
 * Calculates compound annual growth rate (CAGR)
 */
export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

/**
 * Calculates daily returns for a price series
 */
export function calculateDailyReturns(prices: (number | null)[]): (number | null)[] {
  const returns: (number | null)[] = [];
  for (let i = 1; i < prices.length; i++) {
    const curr = prices[i];
    const prev = prices[i - 1];
    if (curr === null || prev === null || prev === 0) {
      returns.push(null);
    } else {
      returns.push((curr - prev) / prev);
    }
  }
  return returns;
}

/**
 * Calculates mean of an array
 */
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculates variance of an array
 */
export function variance(arr: number[], isSample: boolean = true): number {
  if (arr.length <= 1) return 0;
  const avg = mean(arr);
  const sumSqDiff = arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0);
  return sumSqDiff / (arr.length - (isSample ? 1 : 0));
}

/**
 * Calculates standard deviation
 */
export function stdDev(arr: number[], isSample: boolean = true): number {
  return Math.sqrt(variance(arr, isSample));
}

/**
 * Calculates downside standard deviation (for Sortino Ratio)
 * Only considers returns below the target return (usually 0)
 */
export function downsideStdDev(arr: number[], targetReturn: number = 0, isSample: boolean = true): number {
  if (arr.length <= 1) return 0;
  const negativeReturns = arr.map(r => Math.min(0, r - targetReturn));
  const sumSqDiff = negativeReturns.reduce((sum, val) => sum + Math.pow(val, 2), 0);
  const denominator = arr.length - (isSample ? 1 : 0);
  return Math.sqrt(sumSqDiff / denominator);
}

/**
 * Calculates maximum drawdown of a price series
 */
export function calculateMaxDrawdown(prices: number[]): number {
  if (prices.length === 0) return 0;
  let maxDrawdown = 0;
  let peak = prices[0];

  for (const price of prices) {
    if (price > peak) {
      peak = price;
    }
    const drawdown = (peak - price) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Calculates covariance between two return series
 */
export function covariance(arr1: number[], arr2: number[], isSample: boolean = true): number {
  if (arr1.length !== arr2.length || arr1.length <= 1) return 0;
  const avg1 = mean(arr1);
  const avg2 = mean(arr2);
  let sumProd = 0;
  for (let i = 0; i < arr1.length; i++) {
    sumProd += (arr1[i] - avg1) * (arr2[i] - avg2);
  }
  return sumProd / (arr1.length - (isSample ? 1 : 0));
}

/**
 * Calculates the covariance matrix for a matrix of return series
 * Returns an NxN matrix (annualized)
 */
export function calculateCovarianceMatrix(
  assetReturns: number[][], // Row: Asset, Column: Day return
  tradingDaysPerYear: number = 252
): number[][] {
  const numAssets = assetReturns.length;
  const covMatrix: number[][] = Array(numAssets).fill(0).map(() => Array(numAssets).fill(0));

  for (let i = 0; i < numAssets; i++) {
    for (let j = 0; j <= i; j++) {
      const dailyCov = covariance(assetReturns[i], assetReturns[j]);
      // Annualize the covariance by multiplying by the trading days
      const annualizedCov = dailyCov * tradingDaysPerYear;
      covMatrix[i][j] = annualizedCov;
      covMatrix[j][i] = annualizedCov; // Symmetric matrix
    }
  }

  return covMatrix;
}

/**
 * Performs Cholesky Decomposition (L * L^T = A)
 * Receives a symmetric positive-definite covariance matrix
 * Returns the lower triangular matrix L.
 * Includes diagonal regularization to prevent failure on semi-definite matrices.
 */
export function choleskyDecomposition(matrix: number[][]): number[][] {
  const n = matrix.length;
  const L: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  // Clone and regularize matrix diagonal slightly to ensure strict positive-definiteness
  // This is a standard quantitative finance adjustment to avoid issues with highly correlated assets
  const A = matrix.map((row, i) => 
    row.map((val, j) => i === j ? val + 1e-8 : val)
  );

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += L[i][k] * L[j][k];
      }

      if (i === j) {
        const val = A[i][i] - sum;
        // If val is negative due to float precision, clamp to 0 or a very small positive number
        L[i][j] = Math.sqrt(Math.max(val, 1e-12));
      } else {
        L[i][j] = (A[i][j] - sum) / L[j][j];
      }
    }
  }

  return L;
}

/**
 * Box-Muller transform to generate standard normal variables N(0, 1)
 */
export function randomNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Calibrates GARCH(1,1) parameters based on historical annualized volatility.
 * Unconditional daily variance V_L = (annualVolatility^2) / 252.
 * We assume alpha = 0.08 and beta = 0.90, so omega = V_L * (1 - alpha - beta) = V_L * 0.02.
 */
export interface GarchParameters {
  omega: number;
  alpha: number;
  beta: number;
}

export function calibrateGarchParameters(annualVolatility: number): GarchParameters {
  const dailyVariance = Math.pow(annualVolatility, 2) / 252;
  const alpha = 0.08;
  const beta = 0.90;
  const omega = dailyVariance * (1 - alpha - beta);
  return { omega, alpha, beta };
}

/**
 * Merton Jump Diffusion Jump shock generation
 * Returns the jump return rate (Y_t - 1) if a jump occurs, otherwise 0.
 * In step dt = 1/252, probability of a jump is lambda * dt.
 */
export function generateMertonJump(
  lambda: number, // Jumps per year (e.g., 1.5)
  muJ: number,    // Mean jump size log-return (e.g., -0.05)
  sigmaJ: number, // Jump volatility (e.g., 0.10)
  dt: number      // Time step (e.g., 1 / 252)
): number {
  if (Math.random() < lambda * dt) {
    const jumpZ = randomNormal();
    return Math.exp(muJ + sigmaJ * jumpZ) - 1;
  }
  return 0;
}

/**
 * Expected jump size premium k = E[Y_t - 1] = exp(muJ + 0.5 * sigmaJ^2) - 1
 */
export function calculateMertonCompensator(muJ: number, sigmaJ: number): number {
  return Math.exp(muJ + 0.5 * Math.pow(sigmaJ, 2)) - 1;
}

/**
 * Generates a vector of correlated normal variables using Cholesky factor L
 */
export function generateCorrelatedNormals(L: number[][]): number[] {
  const n = L.length;
  const Z: number[] = Array(n).fill(0).map(() => randomNormal());
  const X: number[] = Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j <= i; j++) {
      sum += L[i][j] * Z[j];
    }
    X[i] = sum;
  }

  return X;
}

/**
 * Calculates financial metrics for a single asset or portfolio price history
 */
export function calculateSingleAssetMetrics(
  prices: number[],
  returns: number[],
  riskFreeRate: number = 0.04, // 4% default risk-free rate in 2026
  tradingDaysPerYear: number = 252
): SingleAssetMetrics {
  if (prices.length <= 1) {
    return { cagr: 0, volatility: 0, sharpeRatio: 0, sortinoRatio: 0, maxDrawdown: 0 };
  }

  const startValue = prices[0];
  const endValue = prices[prices.length - 1];
  const years = prices.length / tradingDaysPerYear;

  const cagr = calculateCAGR(startValue, endValue, years);
  const dailyVol = stdDev(returns);
  const volatility = dailyVol * Math.sqrt(tradingDaysPerYear);

  // Annualized metrics for Sharpe/Sortino
  const excessReturn = cagr - riskFreeRate;
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

  const dailyDownsideVol = downsideStdDev(returns, 0);
  const downsideVol = dailyDownsideVol * Math.sqrt(tradingDaysPerYear);
  const sortinoRatio = downsideVol > 0 ? excessReturn / downsideVol : 0;

  const maxDrawdown = calculateMaxDrawdown(prices);

  return {
    cagr,
    volatility,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
  };
}

/**
 * Compiles comprehensive metrics for portfolio vs benchmark
 */
export function compileHistoricalMetrics(
  dates: string[],
  alignedPrices: { [ticker: string]: number | null }[],
  weights: { [ticker: string]: number },
  benchmarkPrices: number[],
  riskFreeRate: number = 0.04
): HistoricalMetrics {
  const numDays = dates.length;
  
  // 1. Calculate historical portfolio values (starting with $10,000)
  const portfolioValues: number[] = [];
  const startCapital = 10000;

  // Rebalancing: let's track holding weights daily. For pure historical, we assume "buy and hold" or "daily rebalanced".
  // A standard way to do "historical portfolio" is "rebalanced to target weights daily" (for simplicity/purity) or "buy and hold".
  // Let's implement static daily rebalancing for return calculation which represents the index strategy, or standard buy and hold.
  // Buy-and-hold is more realistic for real portfolios, but daily rebalanced is standard for index calculation.
  // Let's do daily rebalanced for smooth returns: portfolio daily return = sum(asset daily return * weight).
  // Then construct portfolio values from daily returns. This is mathematically cleanest.
  const tickers = Object.keys(weights);
  const dailyReturnsByAsset: { [ticker: string]: (number | null)[] } = {};
  
  tickers.forEach(ticker => {
    const assetPrices = alignedPrices.map(row => row[ticker]);
    dailyReturnsByAsset[ticker] = calculateDailyReturns(assetPrices);
  });

  const portfolioReturns: number[] = [];
  portfolioValues.push(startCapital);

  // Daily portfolio return with dynamic weighting:
  // For each day, sum the weights of assets that have a valid return (i.e. are post-inception).
  // Renormalize those weights so they sum to 1.0 and compute the weighted daily return.
  // Effect: assets with shorter histories effectively hold 0% pre-inception, and the
  // remaining assets' weights are scaled up proportionally to fill the gap.
  for (let t = 0; t < numDays - 1; t++) {
    let dayReturn = 0;
    let activeWeightSum = 0;

    tickers.forEach(ticker => {
      const assetReturn = dailyReturnsByAsset[ticker][t];
      if (assetReturn !== null) {
        activeWeightSum += weights[ticker];
      }
    });

    if (activeWeightSum > 0) {
      tickers.forEach(ticker => {
        const assetReturn = dailyReturnsByAsset[ticker][t];
        if (assetReturn !== null) {
          const adjustedWeight = weights[ticker] / activeWeightSum;
          dayReturn += assetReturn * adjustedWeight;
        }
      });
    }

    portfolioReturns.push(dayReturn);
    portfolioValues.push(portfolioValues[portfolioValues.length - 1] * (1 + dayReturn));
  }

  // 2. Benchmark daily returns & values
  const benchmarkReturns = calculateDailyReturns(benchmarkPrices) as number[];
  const benchmarkNormalizedValues: number[] = [];
  const benchStartPrice = benchmarkPrices[0];
  benchmarkPrices.forEach(p => {
    benchmarkNormalizedValues.push((p / benchStartPrice) * startCapital);
  });

  // 3. Compute single asset metrics
  const portfolioMetrics = calculateSingleAssetMetrics(portfolioValues, portfolioReturns, riskFreeRate);
  const benchmarkMetrics = calculateSingleAssetMetrics(benchmarkNormalizedValues, benchmarkReturns, riskFreeRate);

  // 4. Calculate portfolio-benchmark metrics (Beta, Correlation, Alpha)
  const corr = covariance(portfolioReturns, benchmarkReturns) / (stdDev(portfolioReturns) * stdDev(benchmarkReturns));
  const benchVar = variance(benchmarkReturns);
  const beta = benchVar > 0 ? covariance(portfolioReturns, benchmarkReturns) / benchVar : 1;
  
  // Alpha (Jensen's Alpha) = Rp - [Rf + Beta * (Rm - Rf)]
  const expectedBenchmarkExcess = benchmarkMetrics.cagr - riskFreeRate;
  const alpha = portfolioMetrics.cagr - (riskFreeRate + beta * expectedBenchmarkExcess);

  return {
    dates,
    portfolioPrices: portfolioValues,
    portfolioReturns,
    benchmarkPrices: benchmarkNormalizedValues,
    benchmarkReturns,
    metrics: {
      portfolio: portfolioMetrics,
      benchmark: benchmarkMetrics,
      correlation: isNaN(corr) ? 0 : corr,
      beta: isNaN(beta) ? 1 : beta,
      alpha: isNaN(alpha) ? 0 : alpha,
    },
  };
}
