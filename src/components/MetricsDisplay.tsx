import { useState } from 'react';
import { TrendingUp, ShieldAlert, Sparkles, Scale, Percent, Zap, ChevronDown, ChevronUp, FileChartLine } from 'lucide-react';
import type { HistoricalMetrics, SimulationSummary } from '@/types';
import InfoTooltip from '@/components/InfoTooltip';

interface MetricsDisplayProps {
  historicalData: HistoricalMetrics | null;
  simulationData: SimulationSummary | null;
}

export function MetricsDisplay({
  historicalData,
  simulationData,
}: MetricsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!historicalData) return null;

  const hPort = historicalData.metrics.portfolio;
  const hBench = historicalData.metrics.benchmark;

  const sMetrics = simulationData?.metrics;

  const formatPercent = (val: number) => {
    return `${(val * 100).toFixed(2)}%`;
  };

  const formatProbability = (prob: number, decimals = 1, allowZero = true) => {
    if (prob >= 0.999) return '> 99.9%';
    if (prob >= 0.99) return '> 99%';
    if (prob <= 0.001 && prob > 0) return '< 0.1%';
    if (prob <= 0.01 && prob > 0) return '< 1%';
    if (prob === 0) return allowZero ? '0%' : '< 0.1%';
    return `${(prob * 100).toFixed(decimals)}%`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <FileChartLine className="w-5 h-5" />
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Analytical Insights</h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-all duration-300 shadow-sm hover:shadow uppercase tracking-wider"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp className="w-3 h-3" />
            </>
          ) : (
            <>
              More Insights <ChevronDown className="w-3 h-3" />
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CAGR Card */}
        <div className="bg-white dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800/60 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full filter blur-xl translate-x-4 -translate-y-4" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Annual Return (CAGR)</span>
            <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {formatPercent(hPort.cagr)}
            </p>
            <p className="text-[10px] text-slate-500">
              Benchmark: <span className="font-semibold text-slate-600 dark:text-slate-400">{formatPercent(hBench.cagr)}</span>
            </p>
            {sMetrics && (
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium pt-1 border-t border-slate-200 dark:border-slate-800/40 mt-1">
                Projected Median: <span className="font-bold">{formatPercent(sMetrics.expectedCagr)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Volatility Card */}
        <div className="bg-white dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800/60 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl translate-x-4 -translate-y-4" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Annualized Risk</span>
            <ShieldAlert className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {formatPercent(hPort.volatility)}
            </p>
            <p className="text-[10px] text-slate-500">
              Benchmark: <span className="font-semibold text-slate-600 dark:text-slate-400">{formatPercent(hBench.volatility)}</span>
            </p>
            {sMetrics && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-1 border-t border-slate-200 dark:border-slate-800/40 mt-1">
                Projected Risk: <span className="font-bold">{formatPercent(sMetrics.volatility)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Risk-Adjusted Card (Sharpe & Sortino) */}
        <div className="bg-white dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800/60 rounded-2xl relative overflow-hidden group hover:border-violet-500/30 transition-colors shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full filter blur-xl translate-x-4 -translate-y-4" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Sharpe & Sortino</span>
            <Scale className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {hPort.sharpeRatio.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-500">
              Sortino Ratio: <span className="font-semibold text-slate-600 dark:text-slate-400">{hPort.sortinoRatio.toFixed(2)}</span>
            </p>
            {sMetrics && (
              <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium pt-1 border-t border-slate-200 dark:border-slate-800/40 mt-1">
                Proj. Sharpe: <span className="font-bold">{sMetrics.sharpeRatio.toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Max Drawdown Card */}
        <div className="bg-white dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800/60 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-colors shadow-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-xl translate-x-4 -translate-y-4" />
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Max Historical Drawdown</span>
            <Percent className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-2xl font-black text-rose-500 dark:text-rose-400 tracking-tight">
              -{formatPercent(hPort.maxDrawdown)}
            </p>
            <p className="text-[10px] text-slate-500">
              Benchmark: <span className="font-semibold text-rose-600 dark:text-rose-500/80">-{formatPercent(hBench.maxDrawdown)}</span>
            </p>
            {sMetrics && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-1 border-t border-slate-200 dark:border-slate-800/40 mt-1">
                Value at Risk (95%): <span className="font-bold">{formatCurrency(sMetrics.valueAtRisk95)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`space-y-6 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {/* Regression & Modern CAPM metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/50 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-300">
            <Zap className="w-4.5 h-4.5 text-yellow-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Jensen's Alpha</p>
            <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
              {(historicalData.metrics.alpha * 100).toFixed(2)}%
            </p>
            <p className="text-[9px] text-slate-500 truncate">Outperformance over risk-adjusted expectation</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/50 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-300">
            <Scale className="w-4.5 h-4.5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Portfolio Beta</p>
            <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
              {historicalData.metrics.beta.toFixed(2)}
            </p>
            <p className="text-[9px] text-slate-500 truncate">Sensitivity relative to market benchmark</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/50 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-300">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Correlation</p>
            <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
              {(historicalData.metrics.correlation * 100).toFixed(1)}%
            </p>
            <p className="text-[9px] text-slate-500 truncate">R-squared linkage with benchmark</p>
          </div>
        </div>
      </div>

      {/* Simulation Risk & Probabilities Displays */}
      {sMetrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white dark:bg-slate-900/20 p-4 border border-slate-200 dark:border-slate-800/40 rounded-2xl shadow-sm">
            {/* Probability of Loss */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400" /> Probability of Capital Loss
                  <InfoTooltip content={`Likelihood that the final portfolio value drops below the initial investment of ${formatCurrency(sMetrics.initialValue)} after ${simulationData.percentiles.p50.length - 1} years.`} />
                </span>
                <span className={sMetrics.probabilityOfLoss > 0.3 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}>
                  {formatProbability(sMetrics.probabilityOfLoss, 1, false)}
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-rose-500 dark:from-yellow-500 dark:to-rose-500 rounded-full transition-all duration-500" 
                  style={{ width: `${sMetrics.probabilityOfLoss * 100}%` }}
                />
              </div>
            </div>

            {/* Probability of Double/Target */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Probability of Doubling Capital
                  <InfoTooltip content={`Likelihood that the final portfolio value exceeds ${formatCurrency(sMetrics.initialValue * 2)} (200% return) after ${simulationData.percentiles.p50.length - 1} years.`} />
                </span>
                <span className="text-emerald-500 dark:text-emerald-400">
                  {formatProbability(sMetrics.probabilityOfTarget, 1, true)}
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 dark:from-blue-500 dark:to-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${sMetrics.probabilityOfTarget * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Frictions and Realism Report Card */}
          {(sMetrics.medianTotalFeesPaid > 0 || sMetrics.medianTotalTaxesPaid > 0 || sMetrics.medianInflationAdjustedValue !== sMetrics.medianFinalValue) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-500/5 dark:bg-amber-500/5 p-4 border border-amber-500/10 rounded-2xl shadow-sm">
              <div className="space-y-1">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Median Transaction Fees</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200">
                  {formatCurrency(sMetrics.medianTotalFeesPaid)}
                </p>
                <p className="text-[9px] text-slate-500">Cumulative fees & slippage over horizon</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Median Capital Gains Tax</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200">
                  {formatCurrency(sMetrics.medianTotalTaxesPaid)}
                </p>
                <p className="text-[9px] text-slate-500">Total taxes incurred from rebalancing/sales</p>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Real Purchasing Power</p>
                <p className="text-lg font-extrabold text-slate-800 dark:text-slate-200">
                  {formatCurrency(sMetrics.medianInflationAdjustedValue)}
                </p>
                <p className="text-[9px] text-slate-500">Final value in inflation-discounted Year 0 dollars</p>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
