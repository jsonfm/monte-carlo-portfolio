import { useState, useMemo } from 'react';
import { Clipboard, Check, Download } from 'lucide-react';
import type { Asset, SimulationSummary, HistoricalMetrics } from '@/types';
import { 
  formatCurrency, 
  formatPercent, 
  formatProbability,
  getConcentrationDetails,
  calculateFrictionDrag,
  calculateDepletionMetrics,
  solveRequiredCapital,
  generateInstitutionalRecommendations
} from '@/utils/reportInsights';

interface ExportBarProps {
  simulationData: SimulationSummary;
  historicalData: HistoricalMetrics | null;
  assets: Asset[];
  horizonYears: number;
  model: 'gbm' | 'bootstrap';
  rebalanceFrequency: string;
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
  customGoal: string;
}

export function ExportBar({
  simulationData,
  historicalData,
  assets,
  horizonYears,
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
  customGoal,
}: ExportBarProps) {
  const [copied, setCopied] = useState(false);

  // Generate full text report contents
  const reportText = useMemo(() => {
    const m = simulationData.metrics;
    const finalValues = simulationData.finalValues;
    const numSims = finalValues.length;

    const assetsStr = assets.map(a => ` - ${a.ticker} (${a.name}): ${a.weight}% [${a.type}]`).join('\n');
    const { hhi, rating, classification } = getConcentrationDetails(assets);
    
    // Scenarios
    const endP10 = simulationData.percentiles.p10[horizonYears]?.value ?? 0;
    const endP25 = simulationData.percentiles.p25[horizonYears]?.value ?? 0;
    const endP50 = simulationData.percentiles.p50[horizonYears]?.value ?? 0;
    const endP75 = simulationData.percentiles.p75[horizonYears]?.value ?? 0;
    const endP90 = simulationData.percentiles.p90[horizonYears]?.value ?? 0;

    // Frictions & Withdrawals
    const friction = calculateFrictionDrag(simulationData);
    const depletion = calculateDepletionMetrics(simulationData, monthlyWithdrawal, m.initialValue);

    // Goal solver
    const goalTarget = parseFloat(customGoal.replace(/[^0-9.]/g, ''));
    let goalStr = 'None configured';
    if (!isNaN(goalTarget) && goalTarget > 0) {
      const achieved = finalValues.filter(v => v >= goalTarget).length;
      const prob = achieved / numSims;
      const startingCapital = solveRequiredCapital(simulationData, goalTarget);
      goalStr = `Target Goal: ${formatCurrency(goalTarget)}
 - Probability of Achievement: ${formatProbability(prob, 1)}
 - Suggested Initial Capital (80% Confidence): ${startingCapital ? formatCurrency(startingCapital) : 'N/A'}`;
    }

    // Benchmark comparison
    let benchStr = 'Benchmark pricing not loaded';
    if (historicalData) {
      const hPort = historicalData.metrics.portfolio;
      const hBench = historicalData.metrics.benchmark;
      const { alpha, beta, correlation } = historicalData.metrics;
      benchStr = `Benchmark: ${historicalData.dates[0] ? `Backtested dates ${historicalData.dates[0]} to ${historicalData.dates[historicalData.dates.length - 1]}` : ''}
 - Portfolio CAGR: ${formatPercent(hPort.cagr)} | Benchmark CAGR: ${formatPercent(hBench.cagr)}
 - Portfolio Volatility: ${formatPercent(hPort.volatility)} | Benchmark Volatility: ${formatPercent(hBench.volatility)}
 - Portfolio Sharpe: ${hPort.sharpeRatio.toFixed(2)} | Benchmark Sharpe: ${hBench.sharpeRatio.toFixed(2)}
 - Portfolio Sortino: ${hPort.sortinoRatio.toFixed(2)} | Benchmark Sortino: ${hBench.sortinoRatio.toFixed(2)}
 - Portfolio Max Drawdown: -${formatPercent(hPort.maxDrawdown)} | Benchmark Max Drawdown: -${formatPercent(hBench.maxDrawdown)}
 - Jensen's Alpha: ${(alpha * 100).toFixed(2)}% | Systematic Beta: ${beta.toFixed(2)} | Correlation Link: ${formatPercent(correlation)}`;
    }

    // Recommendations list
    const bondWeight = assets.filter(a => a.type === 'bond').reduce((sum, a) => sum + a.weight, 0);
    const recommendations = generateInstitutionalRecommendations({
      assets,
      horizonYears,
      simulationData,
      historicalMetrics: historicalData,
      rebalanceFrequency,
      useMertonJumps,
      monthlyWithdrawal,
      adjustInflation,
      initialInvestment: m.initialValue,
      bondWeight,
    });
    const recsStr = recommendations.length > 0 
      ? recommendations.map((r, i) => `${i + 1}. [${r.type.toUpperCase()}] ${r.title}\n    Detail: ${r.description}${r.impact ? `\n    Impact: ${r.impact}` : ''}`).join('\n')
      : ' - No active considerations identified.';

    return `========================================================================
MONTE CARLO SIMULATION EXECUTIVE REPORT
========================================================================
Generated on: ${new Date().toLocaleDateString()}
Horizon: ${horizonYears} Years
Simulation Trials: ${numSims.toLocaleString()} Paths
Initial Invested Capital: ${formatCurrency(m.initialValue)}

------------------------------------------------------------------------
1. SIMULATION PARAMETERS & ASSUMED CONSTRAINTS
------------------------------------------------------------------------
 - Engine Core Model: ${model === 'gbm' ? 'Geometric Brownian Motion (GBM)' : 'Historical Block Resample'}
 - Periodic Cash Flows: ${monthlyContribution > 0 ? `+${formatCurrency(monthlyContribution)}/month` : 'No Deposits'} | ${monthlyWithdrawal > 0 ? `-${formatCurrency(monthlyWithdrawal)}/month` : 'No Withdrawals'}
 - Real Inflation Drag: ${adjustInflation ? `Real Adjusted (${(annualInflationRate * 100).toFixed(1)}% annual drag)` : 'Nominal Baseline (Unadjusted)'}
 - Account Tax Type: ${isTaxable ? `Taxable (${(capitalGainsTaxRate * 100).toFixed(0)}% Capital Gains)` : 'Tax-Advantaged (Sheltered)'}
 - Transaction Commissions Fee: ${(transactionFeeRate * 100).toFixed(2)}% per trade
 - Rebalancing Strategy: ${rebalanceFrequency === 'threshold' ? `Threshold-Based (±${rebalanceThreshold.toFixed(1)}%)` : rebalanceFrequency === 'none' ? 'No Rebalancing' : `Calendar-Based (${rebalanceFrequency})`}
 - Advanced Mechanics: ${model === 'gbm' ? `${useGarch ? 'GARCH Vol Clustering' : 'Static Volatility'} | ${useMertonJumps ? 'Merton Jump-Diffusion enabled' : 'Continuous paths only'}` : `Block size: ${bootstrapBlockSize} trading days`}

------------------------------------------------------------------------
2. PORTFOLIO ALLOCATION & AUDIT
------------------------------------------------------------------------
Allocated Weights:
${assetsStr}

Audit Concentration metrics:
 - Herfindahl-Hirschman Index (HHI): ${hhi.toFixed(0)}
 - Diversification Rating: Grade ${rating} (${classification})

------------------------------------------------------------------------
3. PERFORMANCE PROJECTIONS & SCENARIOS
------------------------------------------------------------------------
Percentile Outcomes at Horizon:
 - Optimistic (90th Percentile): ${formatCurrency(endP90)} (${formatPercent((endP90 - m.initialValue) / m.initialValue)} Nom, ${(endP90 / m.initialValue).toFixed(1)}x)
 - Moderate High (75th Percentile): ${formatCurrency(endP75)} (${formatPercent((endP75 - m.initialValue) / m.initialValue)} Nom, ${(endP75 / m.initialValue).toFixed(1)}x)
 - Median Expected (50th Percentile): ${formatCurrency(endP50)} (${formatPercent((endP50 - m.initialValue) / m.initialValue)} Nom, ${(endP50 / m.initialValue).toFixed(1)}x)
 - Conservative (25th Percentile): ${formatCurrency(endP25)} (${formatPercent((endP25 - m.initialValue) / m.initialValue)} Nom, ${(endP25 / m.initialValue).toFixed(1)}x)
 - Pessimistic (10th Percentile): ${formatCurrency(endP10)} (${formatPercent((endP10 - m.initialValue) / m.initialValue)} Nom, ${(endP10 / m.initialValue).toFixed(1)}x)

Smug CAGR (Median expected): ${formatPercent(m.expectedCagr)}
Nominal Volatility: ${formatPercent(m.volatility)}

------------------------------------------------------------------------
4. DOWNSIDE PROTECTION & TAIL RISK
------------------------------------------------------------------------
 - Absolute Worst Simulated Value: ${formatCurrency(finalValues[0] ?? 0)}
 - Absolute Best Simulated Value: ${formatCurrency(finalValues[finalValues.length - 1] ?? 0)}
 - 95% Value at Risk (95% VaR): ${formatCurrency(m.valueAtRisk95)}
 - 95% Conditional Value at Risk (95% CVaR): ${formatCurrency(m.conditionalValueAtRisk95)}
 - Principal Capital Loss Probability: ${formatProbability(m.probabilityOfLoss, 1)}
 - Total Median Structural Frictions Paid: ${formatCurrency(friction.totalFrictions)} (${formatPercent(friction.dragPercentage)} of final wealth)
 ${monthlyWithdrawal > 0 ? `\n- Safe Withdrawal Rate (Annualized): ${formatPercent(depletion.annualWithdrawalRate)}\n - Estimated Depletion Probability: ${formatProbability(depletion.depletionProbability, 1)}\n - Trinity status: ${depletion.trinityStatus}` : ''}

------------------------------------------------------------------------
5. HISTORICAL BENCHMARK COMPARISON
------------------------------------------------------------------------
${benchStr}

------------------------------------------------------------------------
6. CUSTOM GOAL SOLVER
------------------------------------------------------------------------
${goalStr}

------------------------------------------------------------------------
7. PORTFOLIO ANALYSIS CONSIDERATIONS
------------------------------------------------------------------------
${recsStr}

========================================================================
Report compiled by Smart Monte Carlo Engine. Analytical Reference Memo.
`;
  }, [
    simulationData,
    historicalData,
    assets,
    horizonYears,
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
    customGoal,
  ]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const downloadTextReport = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Monte_Carlo_Executive_Report_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center justify-end print:hidden">
      
      {/* Copy Text Button */}
      <button
        type="button"
        onClick={copyToClipboard}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm uppercase tracking-wider cursor-pointer"
        title="Copy raw text report to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied Memo
          </>
        ) : (
          <>
            <Clipboard className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Copy Text Memo
          </>
        )}
      </button>

      {/* Download .txt Button */}
      <button
        type="button"
        onClick={downloadTextReport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm uppercase tracking-wider cursor-pointer"
        title="Download text file of the compiled report"
      >
        <Download className="w-3.5 h-3.5 text-blue-500" /> Download .txt
      </button>

    </div>
  );
}
export { formatCurrency, formatPercent, formatProbability };
