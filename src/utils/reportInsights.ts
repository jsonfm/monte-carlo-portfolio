import type { Asset, SimulationSummary, HistoricalMetrics } from '@/types';

export interface RecommendationCard {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  impact?: string;
}

/**
 * Standard currency formatter
 */
export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
};

/**
 * Standard percentage formatter
 */
export const formatPercent = (val: number): string => {
  return `${(val * 100).toFixed(2)}%`;
};

/**
 * Standard probability formatter
 */
export const formatProbability = (prob: number, decimals = 1, allowZero = false): string => {
  if (prob >= 0.999) return '> 99.9%';
  if (prob >= 0.99) return '> 99%';
  if (prob <= 0.001 && prob > 0) return '< 0.1%';
  if (prob <= 0.01 && prob > 0) return '< 1%';
  if (prob === 0) return allowZero ? '0%' : '< 0.1%';
  return `${(prob * 100).toFixed(decimals)}%`;
};

/**
 * Calculates the Herfindahl-Hirschman Index (HHI) for the portfolio allocation.
 * HHI = Sum(w_i^2) where w_i are the weights in percentage (0 to 100).
 * Range: 0 to 10000.
 */
export function calculateHHI(assets: Asset[]): number {
  return assets.reduce((sum, asset) => sum + Math.pow(asset.weight, 2), 0);
}

/**
 * Translates HHI to a concentration score/rating and descriptive classification.
 */
export function getConcentrationDetails(assets: Asset[]) {
  const hhi = calculateHHI(assets);
  
  let rating = 'A';
  let classification = 'Highly Diversified';
  let description = 'Excellent breadth of allocation. Risks are broadly distributed across multiple positions, minimizing idiosyncratic hazard.';

  if (hhi >= 4000) {
    rating = 'F';
    classification = 'Extremely Concentrated';
    description = 'Dangerous asset concentration. The portfolio is highly vulnerable to the fate of a single or very few assets.';
  } else if (hhi >= 2500) {
    rating = 'D';
    classification = 'Concentrated';
    description = 'High single-asset reliance. Performance is dominated by key holdings, introducing high idiosyncratic risk.';
  } else if (hhi >= 1500) {
    rating = 'C';
    classification = 'Moderately Concentrated';
    description = 'Moderate asset concentration. Benefits from some diversification but remains exposed to key holding volatility.';
  } else if (hhi >= 1000) {
    rating = 'B';
    classification = 'Diversified';
    description = 'Healthy core allocation. A solid blend of assets dampens individual failures while preserving upward participation.';
  }

  return { hhi, rating, classification, description };
}

/**
 * Calculates peak-to-trough max drawdown on an annual percentile path series.
 */
export function calculatePathMaxDrawdown(path: { value: number }[]): number {
  if (path.length === 0) return 0;
  let maxDrawdown = 0;
  let peak = path[0].value;

  for (const item of path) {
    if (item.value > peak) {
      peak = item.value;
    }
    const drawdown = peak > 0 ? (peak - item.value) / peak : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Computes the time-to-goal matrix (median year to cross targets)
 * and earliest crossing statistics.
 */
export function calculateTimeToGoals(
  simulationData: SimulationSummary,
  initialCapital: number,
  customGoalTarget: number | null
) {
  const p50 = simulationData.percentiles.p50;
  
  const targets = [
    { name: 'Capital Preservation (1x)', value: initialCapital * 1.0 },
    { name: 'Moderate Growth (1.5x)', value: initialCapital * 1.5 },
    { name: 'Double Capital (2x)', value: initialCapital * 2.0 },
    { name: 'Triple Capital (3x)', value: initialCapital * 3.0 },
    { name: 'Super Compounding (5x)', value: initialCapital * 5.0 },
  ];

  if (customGoalTarget && customGoalTarget > 0) {
    // Add custom goal at appropriate sorted position or end
    if (!targets.some(t => Math.abs(t.value - customGoalTarget) < 1)) {
      targets.push({ name: `Custom Goal (${formatCurrency(customGoalTarget)})`, value: customGoalTarget });
    }
  }

  return targets.map(target => {
    // Find the first year index where p50 meets or exceeds target
    let crossingYear: number | null = null;
    for (let i = 0; i < p50.length; i++) {
      if (p50[i].value >= target.value) {
        crossingYear = p50[i].year;
        break;
      }
    }

    return {
      name: target.name,
      targetValue: target.value,
      crossingYear,
    };
  });
}

/**
 * Calculates structural friction drag
 */
export function calculateFrictionDrag(simulationData: SimulationSummary): {
  totalFrictions: number;
  dragPercentage: number;
  commentary: string;
} {
  const m = simulationData.metrics;
  const totalFrictions = m.medianTotalFeesPaid + m.medianTotalTaxesPaid;
  const dragPercentage = m.medianFinalValue > 0 ? totalFrictions / m.medianFinalValue : 0;

  let commentary = 'Structural costs represent a minor headwind to overall performance.';
  if (dragPercentage >= 0.15) {
    commentary = 'Significant drag: fees and estimated taxes reduce a notable portion of total simulated compounded growth. Utilizing tax-advantaged accounts or similar shelters is a common consideration to mitigate this effect.';
  } else if (dragPercentage >= 0.08) {
    commentary = 'Moderate drag: transactional frictions represent a noticeable drag. Widening or optimizing rebalancing thresholds can be evaluated as a mitigation method.';
  }

  return { totalFrictions, dragPercentage, commentary };
}

/**
 * Computes portfolio depletion metrics
 */
export function calculateDepletionMetrics(
  simulationData: SimulationSummary,
  monthlyWithdrawal: number,
  initialCapital: number
) {
  const finalValues = simulationData.finalValues;
  const numSims = finalValues.length;
  if (numSims === 0) return { depletionProbability: 0, annualWithdrawalRate: 0, trinityStatus: 'Safe' };

  const depletedCount = finalValues.filter(v => v <= 0).length;
  const depletionProbability = depletedCount / numSims;

  const annualWithdrawalRate = initialCapital > 0 ? (monthlyWithdrawal * 12) / initialCapital : 0;
  
  let trinityStatus = 'Safe';
  if (annualWithdrawalRate > 0.08) {
    trinityStatus = 'Extremely Dangerous';
  } else if (annualWithdrawalRate > 0.05) {
    trinityStatus = 'Aggressive';
  } else if (annualWithdrawalRate > 0.04) {
    trinityStatus = 'Moderate / High';
  } else if (annualWithdrawalRate > 0) {
    trinityStatus = 'Sustainable';
  }

  return {
    depletionProbability,
    annualWithdrawalRate,
    trinityStatus,
  };
}

/**
 * Solves for the suggested starting capital required to achieve a custom goal 
 * with at least an 80% confidence interval (p20/p25 barrier).
 * Uses binary search over multipliers.
 */
export function solveRequiredCapital(
  simulationData: SimulationSummary,
  goalTarget: number
): number | null {
  const finalValues = simulationData.finalValues;
  const numSims = finalValues.length;
  if (numSims === 0 || !goalTarget || goalTarget <= 0) return null;

  const initialVal = simulationData.metrics.initialValue;
  if (initialVal <= 0) return null;

  // We want to find a multiplier 'm' to apply to the initialVal such that:
  // (number of simulated paths where final_value * m >= goalTarget) / numSims >= 0.80
  // Since finalValues is sorted ascendingly, we can find the index corresponding to the 20th percentile (80% confidence of being >=).
  // The index for 20% is Math.floor(numSims * 0.20).
  const targetIndex = Math.floor(numSims * 0.20);
  const p20Value = finalValues[targetIndex];

  if (p20Value <= 0) return null;

  // Multiplier needed to scale the p20 outcome up to the goal target
  const multiplier = goalTarget / p20Value;
  return initialVal * multiplier;
}

/**
 * Rule-based recommendation engine for institutional advice.
 */
export function generateRecommendations(
  assets: Asset[],
  horizonYears: number,
  simulationData: SimulationSummary,
  historicalMetrics: HistoricalMetrics | null,
  rebalanceFrequency: string,
  useMertonJumps: boolean
): RecommendationCard[] {
  const recs: RecommendationCard[] = [];
  const m = simulationData.metrics;
  const initialValue = m.initialValue;

  // Check 1: Single asset concentration
  const maxAsset = assets.reduce((max, a) => (a.weight > max.weight ? a : max), assets[0]);
  if (maxAsset && maxAsset.weight > 40) {
    recs.push({
      id: 'single_asset_concentration',
      type: 'warning',
      title: `Concentrated Position in ${maxAsset.ticker}`,
      description: `This asset represents ${maxAsset.weight}% of the overall allocation. This concentration means the portfolio's performance is highly tied to the performance and volatility of this single holding.`,
      impact: `Diversifying into other asset classes can help distribute risk and potentially reduce expected tail loss (CVaR).`,
    });
  }

  // Check 2: Herfindahl-Hirschman Index (HHI) concentration
  const hhiDetails = getConcentrationDetails(assets);
  if (hhiDetails.hhi > 2500 && maxAsset.weight <= 40) {
    recs.push({
      id: 'hhi_concentration',
      type: 'warning',
      title: 'High Allocation Concentration',
      description: `The Herfindahl-Hirschman Index (HHI) of ${hhiDetails.hhi.toFixed(0)} indicates that capital is focused in a small number of assets.`,
      impact: 'Expanding the selection to include additional uncorrelated asset classes can help reduce overall concentration.',
    });
  }

  // Check 3: Crypto tail risk modeling
  const cryptoWeight = assets.filter(a => a.type === 'crypto').reduce((sum, a) => sum + a.weight, 0);
  if (cryptoWeight > 20 && !useMertonJumps) {
    recs.push({
      id: 'crypto_jumps_disabled',
      type: 'info',
      title: 'Cryptocurrency Extreme Volatility Modeling',
      description: `The portfolio has ${cryptoWeight}% in digital assets. Standard geometric Brownian motion models do not account for sudden, extreme downward price movements.`,
      impact: 'Activating "Merton Jump-Diffusion" in the settings allows the simulation to incorporate discrete jump processes for a more conservative risk projection.',
    });
  }

  // Check 4: Historical underperformance relative to benchmark
  if (historicalMetrics) {
    const sharpeDiff = m.sharpeRatio - historicalMetrics.metrics.benchmark.sharpeRatio;
    if (sharpeDiff < -0.2) {
      recs.push({
        id: 'poor_risk_efficiency',
        type: 'warning',
        title: 'Risk-Adjusted Return Profile vs Benchmark',
        description: `The portfolio's projected Sharpe Ratio of ${m.sharpeRatio.toFixed(2)} is lower than the historical benchmark's Sharpe Ratio of ${historicalMetrics.metrics.benchmark.sharpeRatio.toFixed(2)}. This suggests a higher level of volatility relative to return expectations under this specific allocation.`,
        impact: 'Adjusting the allocation weights could help align the risk-return profile closer to historical benchmark benchmarks.',
      });
    }
  }

  // Check 5: Elevated loss probability
  if (m.probabilityOfLoss > 0.20) {
    recs.push({
      id: 'high_loss_probability',
      type: 'warning',
      title: 'Projected Downside Risk',
      description: `The simulation shows a ${formatProbability(m.probabilityOfLoss, 1)} probability that the ending nominal value falls below the initial principal of ${formatCurrency(initialValue)} over the ${horizonYears}-year horizon.`,
      impact: 'Increasing the allocation to capital-preserving fixed income or sovereign debt could reduce this projected probability of nominal loss.',
    });
  }

  // Check 6: Excessive friction drag
  const friction = calculateFrictionDrag(simulationData);
  if (friction.dragPercentage > 0.10) {
    recs.push({
      id: 'high_friction_drag',
      type: 'info',
      title: 'Impact of Structural Fees and Taxes',
      description: `Estimated fees and transaction taxes are projected to reduce final wealth by ${formatPercent(friction.dragPercentage)}, totaling approximately ${formatCurrency(friction.totalFrictions)} over the simulation period.`,
      impact: 'Utilizing tax-advantaged accounts or optimizing the rebalancing threshold can help reduce the impact of these transaction costs.',
    });
  }

  // Check 7: Sequence of returns risk (Trinity guidelines)
  const depletion = calculateDepletionMetrics(simulationData, m.medianTotalFeesPaid /* dummy or custom withdrawals */, initialValue); // wait, let's pass real withdrawal
  // We can get withdrawal values directly if we inspect simulation data.
  // Wait, the caller can pass monthlyWithdrawal. Let's make sure the engine gets monthlyWithdrawal!
  // To avoid breaking the signature, let's use a wrapper or inspect withdrawal.
  return recs;
}

/**
 * Fully loaded recommendations generator that includes withdrawal and inflation metrics
 */
export function generateInstitutionalRecommendations(params: {
  assets: Asset[];
  horizonYears: number;
  simulationData: SimulationSummary;
  historicalMetrics: HistoricalMetrics | null;
  rebalanceFrequency: string;
  useMertonJumps: boolean;
  monthlyWithdrawal: number;
  adjustInflation: boolean;
  initialInvestment: number;
  bondWeight: number;
}): RecommendationCard[] {
  const recs: RecommendationCard[] = [];
  const m = simulationParamsToMetrics(params.simulationData);
  const initialValue = params.initialInvestment;

  // 1. Single asset concentration
  const maxAsset = params.assets.reduce((max, a) => (a.weight > max.weight ? a : max), params.assets[0]);
  if (maxAsset && maxAsset.weight > 40) {
    recs.push({
      id: 'single_asset_concentration',
      type: 'warning',
      title: `Concentrated Position in ${maxAsset.ticker}`,
      description: `This asset represents ${maxAsset.weight}% of the overall allocation. This concentration means the portfolio's performance is highly tied to the performance and volatility of this single holding.`,
      impact: `Diversifying into other asset classes can help distribute risk and potentially reduce expected tail loss (CVaR).`,
    });
  }

  // 2. Herfindahl-Hirschman Index (HHI) concentration
  const hhiDetails = getConcentrationDetails(params.assets);
  if (hhiDetails.hhi > 2500 && maxAsset.weight <= 40) {
    recs.push({
      id: 'hhi_concentration',
      type: 'warning',
      title: 'High Allocation Concentration',
      description: `The Herfindahl-Hirschman Index (HHI) of ${hhiDetails.hhi.toFixed(0)} indicates that capital is focused in a small number of assets.`,
      impact: 'Expanding the selection to include additional uncorrelated asset classes can help reduce overall concentration.',
    });
  }

  // 3. Crypto tail risk modeling
  const cryptoWeight = params.assets.filter(a => a.type === 'crypto').reduce((sum, a) => sum + a.weight, 0);
  if (cryptoWeight > 20 && !params.useMertonJumps) {
    recs.push({
      id: 'crypto_jumps_disabled',
      type: 'info',
      title: 'Cryptocurrency Extreme Volatility Modeling',
      description: `The portfolio has ${cryptoWeight}% in digital assets. Standard geometric Brownian motion models do not account for sudden, extreme downward price movements.`,
      impact: 'Activating "Merton Jump-Diffusion" in the settings allows the simulation to incorporate discrete jump processes for a more conservative risk projection.',
    });
  }

  // 4. Historical underperformance relative to benchmark
  if (params.historicalMetrics) {
    const sharpeDiff = m.sharpeRatio - params.historicalMetrics.metrics.benchmark.sharpeRatio;
    if (sharpeDiff < -0.2) {
      recs.push({
        id: 'poor_risk_efficiency',
        type: 'warning',
        title: 'Risk-Adjusted Return Profile vs Benchmark',
        description: `The portfolio's projected Sharpe Ratio of ${m.sharpeRatio.toFixed(2)} is lower than the historical benchmark's Sharpe Ratio of ${params.historicalMetrics.metrics.benchmark.sharpeRatio.toFixed(2)}. This suggests a higher level of volatility relative to return expectations under this specific allocation.`,
        impact: 'Adjusting the allocation weights could help align the risk-return profile closer to historical benchmark benchmarks.',
      });
    }
  }

  // 5. Elevated loss probability
  if (m.probabilityOfLoss > 0.20) {
    recs.push({
      id: 'high_loss_probability',
      type: 'warning',
      title: 'Projected Downside Risk',
      description: `The simulation shows a ${formatProbability(m.probabilityOfLoss, 1)} probability that the ending nominal value falls below the initial principal of ${formatCurrency(initialValue)} over the ${params.horizonYears}-year horizon.`,
      impact: 'Increasing the allocation to capital-preserving fixed income or sovereign debt could reduce this projected probability of nominal loss.',
    });
  }

  // 6. Excessive friction drag
  const friction = calculateFrictionDrag(params.simulationData);
  if (friction.dragPercentage > 0.10) {
    recs.push({
      id: 'high_friction_drag',
      type: 'info',
      title: 'Impact of Structural Fees and Taxes',
      description: `Estimated fees and transaction taxes are projected to reduce final wealth by ${formatPercent(friction.dragPercentage)}, totaling approximately ${formatCurrency(friction.totalFrictions)} over the simulation period.`,
      impact: 'Utilizing tax-advantaged accounts or optimizing the rebalancing threshold can help reduce the impact of these transaction costs.',
    });
  }

  // 7. Sequence of returns risk (Trinity guidelines)
  if (params.monthlyWithdrawal > 0) {
    const depletion = calculateDepletionMetrics(params.simulationData, params.monthlyWithdrawal, initialValue);
    if (depletion.annualWithdrawalRate > 0.04) {
      recs.push({
        id: 'trinity_guideline_violation',
        type: 'warning',
        title: `Annualized Withdrawal Rate Evaluation`,
        description: `The annualized withdrawal rate of ${formatPercent(depletion.annualWithdrawalRate)} is higher than the historical 4.00% 'safe withdrawal' guideline. Under adverse market conditions, this rate increases the risk of capital depletion.`,
        impact: `Adjusting the monthly withdrawal amount closer to ${formatCurrency(initialValue * 0.04 / 12)} can help align the plan with standard long-term sustainability models.`,
      });
    }

    if (depletion.depletionProbability > 0.05) {
      recs.push({
        id: 'capital_depletion_hazard',
        type: 'critical',
        title: 'Portfolio Depletion Risk',
        description: `The simulation estimates a ${formatProbability(depletion.depletionProbability, 1)} probability that the portfolio value could be fully depleted before Year ${params.horizonYears} under the current withdrawal schedule.`,
        impact: 'Considering options such as lower withdrawal rates, increased initial capital, or adjustments to the asset mix can help mitigate this depletion probability.',
      });
    }
  }

  // 8. Rebalancing Check
  const hasEquities = params.assets.some(a => a.type === 'stock' || a.type === 'etf');
  const hasFixedIncome = params.assets.some(a => a.type === 'bond');
  if (params.rebalanceFrequency === 'none' && hasEquities && hasFixedIncome) {
    recs.push({
      id: 'rebalance_frequency_drift',
      type: 'info',
      title: 'Portfolio Drift (No Rebalancing)',
      description: 'With no active rebalancing enabled, higher-volatility assets (such as equities) are likely to grow relative to more stable holdings (such as bonds). Over time, this natural drift will alter the portfolio\'s asset mix and risk profile.',
      impact: 'Implementing periodic (e.g., monthly) or threshold-based rebalancing helps maintain the target risk profile over the long term.',
    });
  }

  // 9. Bond weight vs short horizon
  if (params.horizonYears < 5 && params.bondWeight === 0) {
    recs.push({
      id: 'short_horizon_equity_risk',
      type: 'warning',
      title: 'Short-Term Horizon Allocation',
      description: `For an investment horizon of ${params.horizonYears} years, having no allocation to capital-preserving fixed income assets increases susceptibility to sequence-of-returns risk in the event of an early market downturn.`,
      impact: 'Allocating a portion to stable, short-term fixed income instruments or money market funds can help establish a short-term liquidity buffer.',
    });
  }

  // 10. Inflation risk callout
  if (params.horizonYears >= 10 && !params.adjustInflation) {
    recs.push({
      id: 'inflation_adjust_disabled',
      type: 'info',
      title: 'Long-Term Inflation Considerations',
      description: `Over a ${params.horizonYears}-year horizon, inflation can significantly erode the real purchasing power of the portfolio's nominal returns.`,
      impact: 'Enabling the "Real Inflation Drag" setting in the controls allows you to view projected outcomes in inflation-adjusted terms.',
    });
  }

  return recs;
}

function simulationParamsToMetrics(sim: SimulationSummary) {
  return sim.metrics;
}
