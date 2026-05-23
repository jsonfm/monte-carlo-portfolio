import { useMemo } from 'react';
import { TrendingUp, Award, HelpCircle } from 'lucide-react';
import type { SimulationSummary, Asset } from '@/types';
import { formatCurrency, formatPercent, formatProbability, calculateTimeToGoals } from '@/utils/reportInsights';
import InfoTooltip from '@/components/InfoTooltip';
import { DistributionHistogram } from '@/components/report/DistributionHistogram';

interface PerformanceProjectionProps {
  simulationData: SimulationSummary;
  assets: Asset[];
  horizonYears: number;
  adjustInflation: boolean;
  annualInflationRate: number;
  customGoal: string;
}

export function PerformanceProjection({
  simulationData,
  assets,
  horizonYears,
  adjustInflation,
  annualInflationRate,
  customGoal,
}: PerformanceProjectionProps) {
  const percentiles = simulationData.percentiles;
  const metrics = simulationData.metrics;

  const inflationFactor = useMemo(() => {
    return Math.pow(1 + annualInflationRate, horizonYears);
  }, [annualInflationRate, horizonYears]);

  // Translate customGoal into a parsed float
  const goalTarget = useMemo(() => {
    const parsed = parseFloat(customGoal.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  }, [customGoal]);

  // Compute Scenario Details
  const scenarios = useMemo(() => {
    const endP10 = percentiles.p10[horizonYears]?.value ?? 0;
    const endP25 = percentiles.p25[horizonYears]?.value ?? 0;
    const endP50 = percentiles.p50[horizonYears]?.value ?? 0;
    const endP75 = percentiles.p75[horizonYears]?.value ?? 0;
    const endP90 = percentiles.p90[horizonYears]?.value ?? 0;

    const calculateCagr = (start: number, end: number, years: number) => {
      if (end <= 0 || start <= 0) return -1;
      return Math.pow(end / start, 1 / years) - 1;
    };

    const list = [
      {
        id: 'p90',
        name: 'Optimistic (90th Percentile)',
        desc: 'Secular bull runs or continuous expansion cycles.',
        value: endP90,
        realValue: adjustInflation ? endP90 / inflationFactor : endP90,
        returnPct: (endP90 - metrics.initialValue) / metrics.initialValue,
        multiplier: endP90 / metrics.initialValue,
        cagr: calculateCagr(metrics.initialValue, endP90, horizonYears),
        color: 'text-emerald-600 dark:text-emerald-400',
        barColor: 'bg-emerald-500',
      },
      {
        id: 'p75',
        name: 'Moderate High (75th Percentile)',
        desc: 'Above-average returns in solid market environments.',
        value: endP75,
        realValue: adjustInflation ? endP75 / inflationFactor : endP75,
        returnPct: (endP75 - metrics.initialValue) / metrics.initialValue,
        multiplier: endP75 / metrics.initialValue,
        cagr: calculateCagr(metrics.initialValue, endP75, horizonYears),
        color: 'text-teal-600 dark:text-teal-400',
        barColor: 'bg-teal-500',
      },
      {
        id: 'p50',
        name: 'Median Expected (50th Percentile)',
        desc: 'Baseline normal trend outcome (equal odds of exceeding or falling short).',
        value: endP50,
        realValue: adjustInflation ? endP50 / inflationFactor : endP50,
        returnPct: (endP50 - metrics.initialValue) / metrics.initialValue,
        multiplier: endP50 / metrics.initialValue,
        cagr: calculateCagr(metrics.initialValue, endP50, horizonYears),
        color: 'text-purple-600 dark:text-purple-400',
        barColor: 'bg-purple-500',
      },
      {
        id: 'p25',
        name: 'Conservative (25th Percentile)',
        desc: 'Lagging performance under standard correction cycles.',
        value: endP25,
        realValue: adjustInflation ? endP25 / inflationFactor : endP25,
        returnPct: (endP25 - metrics.initialValue) / metrics.initialValue,
        multiplier: endP25 / metrics.initialValue,
        cagr: calculateCagr(metrics.initialValue, endP25, horizonYears),
        color: 'text-amber-600 dark:text-amber-500',
        barColor: 'bg-amber-500',
      },
      {
        id: 'p10',
        name: 'Pessimistic (10th Percentile)',
        desc: 'Severe, prolonged bear markets or systemic recessions.',
        value: endP10,
        realValue: adjustInflation ? endP10 / inflationFactor : endP10,
        returnPct: (endP10 - metrics.initialValue) / metrics.initialValue,
        multiplier: endP10 / metrics.initialValue,
        cagr: calculateCagr(metrics.initialValue, endP10, horizonYears),
        color: 'text-rose-600 dark:text-rose-400',
        barColor: 'bg-rose-500',
      },
    ];

    return list;
  }, [percentiles, metrics.initialValue, horizonYears, adjustInflation, inflationFactor]);

  // Compute Time to Goals
  const timeToGoals = useMemo(() => {
    return calculateTimeToGoals(simulationData, metrics.initialValue, goalTarget);
  }, [simulationData, metrics.initialValue, goalTarget]);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b-2 border-slate-900/5 dark:border-slate-100/5 pb-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <TrendingUp className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-[0.15em]">
            Performance Projection & Distribution Analysis
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Scenarios Table (7/12 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-1">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Projected Scenarios (Ending Percentiles)
            </h4>
            <InfoTooltip content="Specific outcome bands reflecting various market realities. Median represents normal trend, while Optimistic/Pessimistic represent 90th and 10th percentiles." />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4">Scenario</th>
                    <th className="py-2.5 px-3 text-right">Nominal Value</th>
                    {adjustInflation && (
                      <th className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400">Real Value (Inflation-Adj)</th>
                    )}
                    <th className="py-2.5 px-3 text-right">Gain / Loss</th>
                    <th className="py-2.5 px-4 text-right">Simulated CAGR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/40 text-xs">
                  {scenarios.map((scen) => (
                    <tr 
                      key={scen.id} 
                      className={`hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors ${
                        scen.id === 'p50' ? 'bg-indigo-50/20 dark:bg-indigo-950/10 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-3.5 rounded shrink-0 ${scen.barColor}`} />
                          <div>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 block leading-tight">
                              {scen.name.split(' (')[0]}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5 font-normal">
                              {scen.name.includes('(') ? scen.name.substring(scen.name.indexOf('(')) : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-slate-800 dark:text-slate-100">
                        {formatCurrency(scen.value)}
                      </td>
                      {adjustInflation && (
                        <td className="py-3.5 px-3 text-right font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
                          {formatCurrency(scen.realValue)}
                        </td>
                      )}
                      <td className={`py-3.5 px-3 text-right font-bold ${
                        scen.returnPct >= 0 
                          ? 'text-emerald-500 dark:text-emerald-400' 
                          : 'text-rose-500 dark:text-rose-400'
                      }`}>
                        {scen.returnPct >= 0 ? '+' : ''}{formatPercent(scen.returnPct)}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal block mt-0.5">
                          ({scen.multiplier.toFixed(1)}x)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-600 dark:text-slate-300">
                        {scen.cagr < 0 ? 'N/A' : formatPercent(scen.cagr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Time-To-Goal Matrix (5/12 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-1">
            <Award className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Time-to-Goal Matrix
            </h4>
            <InfoTooltip content="The estimated timeframe required for your median path to meet or exceed specific milestones of your starting investment." />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4.5 space-y-3">
            {timeToGoals.map((goal, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/20 pb-2.5 last:border-0 last:pb-0">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">{goal.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Target: {formatCurrency(goal.targetValue)}</span>
                </div>
                <div className="text-right">
                  {goal.crossingYear !== null ? (
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      Year {goal.crossingYear}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 italic bg-slate-200/50 dark:bg-slate-800/40 px-2 py-0.5 rounded-md">
                      Beyond Horizon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Distribution Histogram section */}
      <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 mt-4">
        <DistributionHistogram 
          finalValues={simulationData.finalValues}
          initialValue={metrics.initialValue}
          medianFinalValue={metrics.medianFinalValue}
        />
      </div>

    </div>
  );
}
