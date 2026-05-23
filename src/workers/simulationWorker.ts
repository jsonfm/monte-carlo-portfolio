import { 
  calculateCovarianceMatrix, 
  choleskyDecomposition, 
  generateCorrelatedNormals, 
  calculateCAGR, 
  stdDev, 
  downsideStdDev 
} from '../utils/mathEngine';
import type { Asset, AssetHistory, PercentilePath, SimulationSummary } from '../types';

// Since this is a Web Worker, we use the self.onmessage event listener
self.onmessage = (e: MessageEvent) => {
  const {
    assets,
    assetsHistory,
    initialInvestment,
    horizonYears,
    simulationsCount,
    model,
    rebalanceFrequency,
  } = e.data;

  try {
    const result = runSimulation({
      assets,
      assetsHistory,
      initialInvestment,
      horizonYears,
      simulationsCount,
      model,
      rebalanceFrequency,
    });
    self.postMessage({ status: 'success', data: result });
  } catch (error) {
    self.postMessage({ status: 'error', error: error instanceof Error ? error.message : 'Simulation failed' });
  }
};

interface WorkerParams {
  assets: Asset[];
  assetsHistory: AssetHistory[];
  initialInvestment: number;
  horizonYears: number;
  simulationsCount: number;
  model: 'gbm' | 'bootstrap';
  rebalanceFrequency: 'none' | 'monthly' | 'annually';
}

function runSimulation(params: WorkerParams): SimulationSummary {
  const {
    assets,
    assetsHistory,
    initialInvestment,
    horizonYears,
    simulationsCount,
    model,
    rebalanceFrequency,
  } = params;

  const numAssets = assets.length;
  const numDaysPerYear = 252; // Standard trading days per year
  const totalSteps = horizonYears * numDaysPerYear;

  // 1. Organize historical returns
  // Align returns: We assume the returns array for each asset matches by day index.
  // In `alignHistoricalData`, we already ensured all assets have aligned date rows.
  const assetTickers = assets.map(a => a.ticker);
  const alignedHistoryMap = new Map<string, AssetHistory>();
  assetsHistory.forEach(h => alignedHistoryMap.set(h.ticker, h));

  const historicalReturns: number[][] = [];
  const expectedReturns: number[] = []; // Annualized CAGR or mean return
  const volatilities: number[] = []; // Annualized volatility

  assetTickers.forEach(ticker => {
    const history = alignedHistoryMap.get(ticker);
    if (!history) {
      throw new Error(`Missing historical data for ${ticker}`);
    }
    historicalReturns.push(history.returns);
    expectedReturns.push(history.cagr);
    volatilities.push(history.volatility);
  });

  // Calculate Covariance Matrix and its Cholesky factor for GBM model
  let L: number[][] = [];
  if (model === 'gbm') {
    const covMatrix = calculateCovarianceMatrix(historicalReturns, numDaysPerYear);
    L = choleskyDecomposition(covMatrix);
  }

  // Target allocation weights in fractional terms
  const targetWeights = assets.map(a => a.weight / 100);

  // Arrays to hold all final simulated values
  const finalValues: number[] = [];
  // Sample paths to return to the UI (e.g., 30 paths for visualization)
  const samplePathsCount = 30;
  const samplePaths: number[][] = [];
  const samplePathsIndices = new Set<number>();
  while (samplePathsIndices.size < Math.min(samplePathsCount, simulationsCount)) {
    samplePathsIndices.add(Math.floor(Math.random() * simulationsCount));
  }

  // Array to hold intermediate daily/yearly values for percentile tracking
  // We track values at the end of each year to build the "cone" chart without overloading memory
  const yearlyGrid: number[][] = Array(horizonYears + 1).fill(0).map(() => []);

  // Set initial year (Year 0) to initial investment for all simulations
  for (let s = 0; s < simulationsCount; s++) {
    yearlyGrid[0].push(initialInvestment);
  }

  // Run the simulations
  const dt = 1 / numDaysPerYear;
  const sqrtDt = Math.sqrt(dt);

  const numHistoricalDays = historicalReturns[0].length;

  for (let s = 0; s < simulationsCount; s++) {
    let portfolioValue = initialInvestment;
    
    // Track asset balances within the portfolio for drifting/rebalancing
    let assetValues = targetWeights.map(w => initialInvestment * w);
    
    const singlePathValues: number[] = [initialInvestment];

    for (let step = 1; step <= totalSteps; step++) {
      let dailyAssetReturns: number[];

      if (model === 'gbm') {
        // Geometric Brownian Motion daily returns
        // Generate correlated random walks
        const correlatedNormals = generateCorrelatedNormals(L);
        dailyAssetReturns = assetTickers.map((_, i) => {
          const mu = expectedReturns[i];
          const sigma = volatilities[i];
          const z = correlatedNormals[i];
          
          // GBM differential: dS/S = mu*dt + sigma*dW
          // Geometric Brownian Motion step: exp((mu - 0.5*sigma^2)*dt + sigma*dW*sqrt(dt)) - 1
          const drift = (mu - 0.5 * sigma * sigma) * dt;
          const diffusion = sigma * z * sqrtDt;
          return Math.exp(drift + diffusion) - 1;
        });
      } else {
        // Historical Bootstrapping
        // Pick a random historical trading day index (preserving cross-asset correlation!)
        const randomDayIndex = Math.floor(Math.random() * numHistoricalDays);
        dailyAssetReturns = assetTickers.map((_, i) => {
          return historicalReturns[i][randomDayIndex];
        });
      }

      // Update asset values and portfolio value
      portfolioValue = 0;
      for (let i = 0; i < numAssets; i++) {
        assetValues[i] = assetValues[i] * (1 + dailyAssetReturns[i]);
        portfolioValue += assetValues[i];
      }

      // Handle rebalancing
      const isRebalanceStep = 
        (rebalanceFrequency === 'monthly' && step % 21 === 0) ||
        (rebalanceFrequency === 'annually' && step % 252 === 0);

      if (isRebalanceStep && portfolioValue > 0) {
        // Re-allocate portfolio value to target weights
        assetValues = targetWeights.map(w => portfolioValue * w);
      }

      // Track yearly values for the grid
      if (step % numDaysPerYear === 0) {
        const year = step / numDaysPerYear;
        yearlyGrid[year].push(portfolioValue);
      }

      // Track daily/yearly details for sample paths
      // For performance/memory reasons, we only record values at the end of each year in the path
      if (step % numDaysPerYear === 0 && samplePathsIndices.has(s)) {
        singlePathValues.push(portfolioValue);
      }
    }

    finalValues.push(portfolioValue);

    if (samplePathsIndices.has(s)) {
      samplePaths.push(singlePathValues);
    }
  }

  // 2. Compute Percentiles for the Cone Chart
  // Sort the simulation values for each year to find the percentiles
  const p10: PercentilePath[] = [{ year: 0, value: initialInvestment }];
  const p25: PercentilePath[] = [{ year: 0, value: initialInvestment }];
  const p50: PercentilePath[] = [{ year: 0, value: initialInvestment }];
  const p75: PercentilePath[] = [{ year: 0, value: initialInvestment }];
  const p90: PercentilePath[] = [{ year: 0, value: initialInvestment }];

  for (let year = 1; year <= horizonYears; year++) {
    const yearValues = [...yearlyGrid[year]].sort((a, b) => a - b);
    
    p10.push({ year, value: yearValues[Math.floor(simulationsCount * 0.10)] });
    p25.push({ year, value: yearValues[Math.floor(simulationsCount * 0.25)] });
    p50.push({ year, value: yearValues[Math.floor(simulationsCount * 0.50)] });
    p75.push({ year, value: yearValues[Math.floor(simulationsCount * 0.75)] });
    p90.push({ year, value: yearValues[Math.floor(simulationsCount * 0.90)] });
  }

  // Sort final simulation values for metrics
  finalValues.sort((a, b) => a - b);
  const medianFinalValue = finalValues[Math.floor(simulationsCount * 0.5)];

  // Expected CAGR of the median path
  const expectedCagr = calculateCAGR(initialInvestment, medianFinalValue, horizonYears);

  // Volatility of final values (log-return standard deviation)
  const logReturns = finalValues.map(v => Math.log(v / initialInvestment));
  const expectedVol = stdDev(logReturns) / Math.sqrt(horizonYears);

  // Downside Volatility
  const downsideVol = downsideStdDev(logReturns, 0) / Math.sqrt(horizonYears);

  // Sharpe and Sortino ratios
  const riskFreeRate = 0.04;
  const sharpeRatio = expectedVol > 0 ? (expectedCagr - riskFreeRate) / expectedVol : 0;
  const sortinoRatio = downsideVol > 0 ? (expectedCagr - riskFreeRate) / downsideVol : 0;

  // 95% Value at Risk (VaR)
  // The 5th percentile outcome: we are 95% confident that the portfolio will end above this value.
  // VaR in $ is: Initial - 5th Percentile Value
  const p05Value = finalValues[Math.floor(simulationsCount * 0.05)];
  const valueAtRisk95 = Math.max(0, initialInvestment - p05Value);

  // 95% Conditional Value at Risk (CVaR)
  // Expected value of the worst 5% of outcomes
  const worst5Percent = finalValues.slice(0, Math.floor(simulationsCount * 0.05));
  const meanWorstValue = worst5Percent.length > 0 ? worst5Percent.reduce((a, b) => a + b, 0) / worst5Percent.length : p05Value;
  const conditionalValueAtRisk95 = Math.max(0, initialInvestment - meanWorstValue);

  // Probability of loss
  const lossCount = finalValues.filter(v => v < initialInvestment).length;
  const probabilityOfLoss = lossCount / simulationsCount;

  // Probability of target (e.g. doubling initial capital)
  const doubleCount = finalValues.filter(v => v >= initialInvestment * 2).length;
  const probabilityOfTarget = doubleCount / simulationsCount;

  return {
    percentiles: { p10, p25, p50, p75, p90 },
    samplePaths,
    finalValues,
    metrics: {
      initialValue: initialInvestment,
      medianFinalValue,
      expectedCagr,
      volatility: expectedVol,
      sharpeRatio,
      sortinoRatio,
      valueAtRisk95,
      conditionalValueAtRisk95,
      probabilityOfLoss,
      probabilityOfTarget,
    },
  };
}
