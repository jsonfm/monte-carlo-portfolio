import { 
  calculateCovarianceMatrix, 
  choleskyDecomposition, 
  generateCorrelatedNormals, 
  calculateCAGR, 
  stdDev, 
  downsideStdDev,
  calibrateGarchParameters,
  calculateMertonCompensator,
  randomNormal
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
    monthlyContribution = 0,
    monthlyWithdrawal = 0,
    adjustInflation = false,
    annualInflationRate = 0.03,
    isTaxable = false,
    capitalGainsTaxRate = 0.15,
    transactionFeeRate = 0.001,
    rebalanceThreshold = 5,
    bootstrapBlockSize = 10,
    useGarch = false,
    useMertonJumps = false,
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
      monthlyContribution,
      monthlyWithdrawal,
      adjustInflation,
      annualInflationRate,
      isTaxable,
      capitalGainsTaxRate,
      transactionFeeRate,
      rebalanceThreshold,
      bootstrapBlockSize,
      useGarch,
      useMertonJumps,
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
  rebalanceFrequency: 'none' | 'monthly' | 'annually' | 'threshold';
  monthlyContribution: number;
  monthlyWithdrawal: number;
  adjustInflation: boolean;
  annualInflationRate: number;
  isTaxable: boolean;
  capitalGainsTaxRate: number;
  transactionFeeRate: number;
  rebalanceThreshold: number;
  bootstrapBlockSize: number;
  useGarch: boolean;
  useMertonJumps: boolean;
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
    monthlyContribution,
    monthlyWithdrawal,
    adjustInflation,
    annualInflationRate,
    isTaxable,
    capitalGainsTaxRate,
    transactionFeeRate,
    rebalanceThreshold,
    bootstrapBlockSize,
    useGarch,
    useMertonJumps,
  } = params;

  const numAssets = assets.length;
  const numDaysPerYear = 252; // Standard trading days per year
  const totalSteps = horizonYears * numDaysPerYear;

  // 1. Organize historical returns
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

  // Pre-calibrate GARCH parameters for all assets if needed
  const garchParamsList = volatilities.map(v => calibrateGarchParameters(v));

  // Target allocation weights in fractional terms
  const targetWeights = assets.map(a => a.weight / 100);

  // Arrays to hold all final simulated values
  const finalValues: number[] = [];
  
  // Track total fees and taxes paid per simulation run
  const finalFeesPaid: number[] = [];
  const finalTaxesPaid: number[] = [];

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
    
    // Track capital gains tax cost basis for each asset
    let costBasis = targetWeights.map(w => initialInvestment * w);
    
    let pathFeesPaid = 0;
    let pathTaxesPaid = 0;

    // Track running daily GARCH variances, initialized to daily historical variance
    const runningVariances = volatilities.map(v => Math.pow(v, 2) / 252);
    let lastDailyReturns = expectedReturns.map(mu => mu / numDaysPerYear);

    const singlePathValues: number[] = [initialInvestment];

    // Contiguous block bootstrap state
    let bootstrapDayIndex = 0;
    let daysRemainingInBlock = 0;

    for (let step = 1; step <= totalSteps; step++) {
      let dailyAssetReturns: number[] = [];

      if (model === 'gbm') {
        // Geometric Brownian Motion daily returns (optionally with GARCH and Merton jumps)
        const correlatedNormals = generateCorrelatedNormals(L);
        dailyAssetReturns = assetTickers.map((_, i) => {
          const mu = expectedReturns[i];
          const z = correlatedNormals[i];

          if (useGarch) {
            const { omega, alpha, beta } = garchParamsList[i];
            const lastVariance = runningVariances[i];
            
            // Expected daily return as baseline
            const expectedDailyReturn = mu / numDaysPerYear;
            const lastReturn = lastDailyReturns[i];
            const lastResidual = lastReturn - expectedDailyReturn;

            // GARCH recurrence: h_t = omega + alpha * e^2_{t-1} + beta * h_{t-1}
            const nextVariance = omega + alpha * Math.pow(lastResidual, 2) + beta * lastVariance;
            runningVariances[i] = nextVariance;

            const dailyVol = Math.sqrt(nextVariance);
            // Standardize the correlated variable by dividing by its baseline historical annualized volatility
            const zStandard = z / volatilities[i];

            const drift = (mu - 0.5 * nextVariance * numDaysPerYear) * dt;
            const diffusion = dailyVol * zStandard; // Daily diffusion
            return Math.exp(drift + diffusion) - 1;
          } else {
            const sigma = volatilities[i];
            const drift = (mu - 0.5 * sigma * sigma) * dt;
            const diffusion = sigma * z * sqrtDt;
            return Math.exp(drift + diffusion) - 1;
          }
        });

        // Apply Merton Jump Diffusion systemic jumps if enabled
        if (useMertonJumps) {
          const lambda = 1.0; // Average 1 shock event per year
          if (Math.random() < lambda * dt) {
            const marketJumpZ = randomNormal();
            dailyAssetReturns = dailyAssetReturns.map((ret, i) => {
              const asset = assets[i];
              // Bonds have positive flight-to-safety jump, stocks/ETFs drop, crypto drops harder
              const assetMuJ = asset.type === 'bond' ? 0.015 : asset.type === 'crypto' ? -0.10 : -0.05;
              const assetSigmaJ = asset.type === 'bond' ? 0.01 : asset.type === 'crypto' ? 0.18 : 0.06;
              const jumpEffect = Math.exp(assetMuJ + assetSigmaJ * marketJumpZ) - 1;

              // Adjust with Merton jump compensator to keep the long-term expected return consistent with CAGR
              const k = calculateMertonCompensator(assetMuJ, assetSigmaJ);
              const compensator = lambda * k * dt;

              return (1 + ret) * (1 - compensator) * (1 + jumpEffect) - 1;
            });
          }
        }
      } else {
        // Historical Bootstrapping with Contiguous Block Sampling
        if (daysRemainingInBlock === 0) {
          const maxStartIndex = numHistoricalDays - bootstrapBlockSize;
          bootstrapDayIndex = Math.floor(Math.random() * Math.max(1, maxStartIndex));
          daysRemainingInBlock = bootstrapBlockSize;
        } else {
          bootstrapDayIndex++;
        }
        daysRemainingInBlock--;

        dailyAssetReturns = assetTickers.map((_, i) => {
          const idx = Math.min(bootstrapDayIndex, numHistoricalDays - 1);
          return historicalReturns[i][idx];
        });
      }

      // Record this step's returns for GARCH next step
      lastDailyReturns = [...dailyAssetReturns];

      // Update asset values and portfolio value
      portfolioValue = 0;
      for (let i = 0; i < numAssets; i++) {
        assetValues[i] = assetValues[i] * (1 + dailyAssetReturns[i]);
        portfolioValue += assetValues[i];
      }

      // Handle periodic monthly cash flows (Inflows/Outflows every 21 days)
      if (step % 21 === 0 && portfolioValue > 0) {
        const yearFraction = step / numDaysPerYear;
        const inflationFactor = adjustInflation ? Math.pow(1 + annualInflationRate, yearFraction) : 1.0;

        const infContribution = monthlyContribution * inflationFactor;
        const infWithdrawal = monthlyWithdrawal * inflationFactor;
        const netCashFlow = infContribution - infWithdrawal;

        if (netCashFlow > 0) {
          // Contributions: allocate across assets based on target weights
          for (let i = 0; i < numAssets; i++) {
            const addVal = netCashFlow * targetWeights[i];
            assetValues[i] += addVal;
            costBasis[i] += addVal;
          }
          portfolioValue += netCashFlow;

          // Deduct transaction fee for the purchase
          const contributionFee = netCashFlow * transactionFeeRate;
          pathFeesPaid += contributionFee;
          for (let i = 0; i < numAssets; i++) {
            assetValues[i] -= contributionFee * targetWeights[i];
            costBasis[i] = Math.max(0, costBasis[i] - contributionFee * targetWeights[i]);
          }
          portfolioValue -= contributionFee;
        } else if (netCashFlow < 0) {
          // Withdrawals: sell assets proportionally to current weights
          const amountToWithdraw = -netCashFlow;
          if (portfolioValue <= amountToWithdraw) {
            assetValues = Array(numAssets).fill(0);
            costBasis = Array(numAssets).fill(0);
            portfolioValue = 0;
          } else {
            let totalTaxesFromWithdrawal = 0;
            const withdrawalFee = amountToWithdraw * transactionFeeRate;
            pathFeesPaid += withdrawalFee;

            for (let i = 0; i < numAssets; i++) {
              const currentWeight = assetValues[i] / portfolioValue;
              const assetWithdrawal = amountToWithdraw * currentWeight;
              
              const f = assetWithdrawal / assetValues[i];
              const soldBasis = f * costBasis[i];
              const realizedGain = Math.max(0, assetWithdrawal - soldBasis);
              const tax = realizedGain * capitalGainsTaxRate;

              if (isTaxable) {
                totalTaxesFromWithdrawal += tax;
              }

              costBasis[i] = Math.max(0, costBasis[i] - soldBasis);
              assetValues[i] -= assetWithdrawal;
            }

            pathTaxesPaid += totalTaxesFromWithdrawal;
            portfolioValue -= amountToWithdraw;

            // Deduct withdrawal fee & tax drag proportionally from remaining asset balances
            const totalDeductions = withdrawalFee + totalTaxesFromWithdrawal;
            if (portfolioValue > totalDeductions) {
              for (let i = 0; i < numAssets; i++) {
                const w = assetValues[i] / portfolioValue;
                assetValues[i] -= totalDeductions * w;
                costBasis[i] = Math.max(0, costBasis[i] - totalDeductions * w);
              }
              portfolioValue -= totalDeductions;
            } else {
              assetValues = Array(numAssets).fill(0);
              costBasis = Array(numAssets).fill(0);
              portfolioValue = 0;
            }
          }
        }
      }

      // Handle rebalancing
      let isRebalanceStep = false;
      if (portfolioValue > 0) {
        if (rebalanceFrequency === 'monthly' && step % 21 === 0) {
          isRebalanceStep = true;
        } else if (rebalanceFrequency === 'annually' && step % 252 === 0) {
          isRebalanceStep = true;
        } else if (rebalanceFrequency === 'threshold') {
          // Trigger if any asset's actual weight drifts beyond rebalanceThreshold % from target
          for (let i = 0; i < numAssets; i++) {
            const actualWeight = assetValues[i] / portfolioValue;
            if (Math.abs(actualWeight - targetWeights[i]) > rebalanceThreshold / 100) {
              isRebalanceStep = true;
              break;
            }
          }
        }
      }

      if (isRebalanceStep && portfolioValue > 0) {
        let totalTradeVolume = 0;
        let totalTaxesFromRebalance = 0;

        const targetValues = targetWeights.map(w => portfolioValue * w);

        // 1. Process Sells first (realizes taxes and gains)
        for (let i = 0; i < numAssets; i++) {
          if (assetValues[i] > targetValues[i]) {
            const amountSold = assetValues[i] - targetValues[i];
            totalTradeVolume += amountSold;

            const f = amountSold / assetValues[i];
            const soldBasis = f * costBasis[i];
            const realizedGain = Math.max(0, amountSold - soldBasis);
            const tax = realizedGain * capitalGainsTaxRate;

            if (isTaxable) {
              totalTaxesFromRebalance += tax;
            }

            costBasis[i] = Math.max(0, costBasis[i] - soldBasis);
            assetValues[i] = targetValues[i];
          }
        }

        // 2. Process Buys next (adds to cost basis)
        for (let i = 0; i < numAssets; i++) {
          if (assetValues[i] < targetValues[i]) {
            const amountBought = targetValues[i] - assetValues[i];
            totalTradeVolume += amountBought;

            costBasis[i] += amountBought;
            assetValues[i] = targetValues[i];
          }
        }

        const rebalanceFee = totalTradeVolume * transactionFeeRate;
        pathFeesPaid += rebalanceFee;
        pathTaxesPaid += totalTaxesFromRebalance;

        // Deduct fees and taxes proportionally from target allocations
        const totalDrag = rebalanceFee + totalTaxesFromRebalance;
        if (portfolioValue > totalDrag) {
          for (let i = 0; i < numAssets; i++) {
            assetValues[i] -= totalDrag * targetWeights[i];
            costBasis[i] = Math.max(0, costBasis[i] - totalDrag * targetWeights[i]);
          }
          portfolioValue -= totalDrag;
        } else {
          assetValues = Array(numAssets).fill(0);
          costBasis = Array(numAssets).fill(0);
          portfolioValue = 0;
        }
      }

      // Track yearly grid value (inflation-adjusted if requested, to show purchase power cone)
      if (step % numDaysPerYear === 0) {
        const year = step / numDaysPerYear;
        const inflationFactor = adjustInflation ? Math.pow(1 + annualInflationRate, year) : 1.0;
        yearlyGrid[year].push(portfolioValue / inflationFactor);
      }

      // Track yearly values for sample path visualization
      if (step % numDaysPerYear === 0 && samplePathsIndices.has(s)) {
        const year = step / numDaysPerYear;
        const inflationFactor = adjustInflation ? Math.pow(1 + annualInflationRate, year) : 1.0;
        singlePathValues.push(portfolioValue / inflationFactor);
      }
    }

    const finalInflationFactor = adjustInflation ? Math.pow(1 + annualInflationRate, horizonYears) : 1.0;
    const finalValueAdjusted = portfolioValue / finalInflationFactor;
    
    finalValues.push(finalValueAdjusted);
    finalFeesPaid.push(pathFeesPaid);
    finalTaxesPaid.push(pathTaxesPaid);

    if (samplePathsIndices.has(s)) {
      samplePaths.push(singlePathValues);
    }
  }

  // 2. Compute Percentiles for the Cone Chart
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

  // Expected CAGR of the median path (adjusted for inflation if checked)
  const expectedCagr = calculateCAGR(initialInvestment, medianFinalValue, horizonYears);

  // Volatility of final values (log-return standard deviation)
  const logReturns = finalValues.map(v => Math.log(Math.max(0.01, v) / initialInvestment));
  const expectedVol = stdDev(logReturns) / Math.sqrt(horizonYears);

  // Downside Volatility
  const downsideVol = downsideStdDev(logReturns, 0) / Math.sqrt(horizonYears);

  // Sharpe and Sortino ratios (assuming risk-free rate 4%)
  const riskFreeRate = 0.04;
  const sharpeRatio = expectedVol > 0 ? (expectedCagr - riskFreeRate) / expectedVol : 0;
  const sortinoRatio = downsideVol > 0 ? (expectedCagr - riskFreeRate) / downsideVol : 0;

  // 95% Value at Risk (VaR)
  const p05Value = finalValues[Math.floor(simulationsCount * 0.05)];
  const valueAtRisk95 = Math.max(0, initialInvestment - p05Value);

  // 95% Conditional Value at Risk (CVaR)
  const worst5Percent = finalValues.slice(0, Math.floor(simulationsCount * 0.05));
  const meanWorstValue = worst5Percent.length > 0 ? worst5Percent.reduce((a, b) => a + b, 0) / worst5Percent.length : p05Value;
  const conditionalValueAtRisk95 = Math.max(0, initialInvestment - meanWorstValue);

  // Probability of loss
  const lossCount = finalValues.filter(v => v < initialInvestment).length;
  const probabilityOfLoss = lossCount / simulationsCount;

  // Probability of target (e.g. doubling initial capital)
  const doubleCount = finalValues.filter(v => v >= initialInvestment * 2).length;
  const probabilityOfTarget = doubleCount / simulationsCount;

  // Compute medians of total fees & taxes paid
  finalFeesPaid.sort((a, b) => a - b);
  finalTaxesPaid.sort((a, b) => a - b);
  const medianTotalFeesPaid = finalFeesPaid[Math.floor(simulationsCount * 0.5)];
  const medianTotalTaxesPaid = finalTaxesPaid[Math.floor(simulationsCount * 0.5)];

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
      medianTotalFeesPaid,
      medianTotalTaxesPaid,
      medianInflationAdjustedValue: medianFinalValue,
    },
  };
}
