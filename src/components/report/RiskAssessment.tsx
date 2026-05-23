import { useMemo } from 'react';
import { ShieldAlert, AlertTriangle, Flame, Scale } from 'lucide-react';
import type { SimulationSummary } from '@/types';
import { 
  formatCurrency, 
  formatPercent, 
  formatProbability, 
  calculatePathMaxDrawdown,
  calculateFrictionDrag,
  calculateDepletionMetrics
} from '@/utils/reportInsights';

interface RiskAssessmentProps {
  simulationData: SimulationSummary;
  horizonYears: number;
  monthlyWithdrawal: number;
  adjustInflation: boolean;
  annualInflationRate: number;
}

export function RiskAssessment({
  simulationData,
  horizonYears,
  monthlyWithdrawal,
  adjustInflation,
}: RiskAssessmentProps) {
  const percentiles = simulationData.percentiles;
  const m = simulationData.metrics;
  const numSims = simulationData.finalValues.length;

  const absoluteWorst = simulationData.finalValues[0] ?? 0;

  // 1. Path drawdowns
  const drawdowns = useMemo(() => {
    return {
      p10: calculatePathMaxDrawdown(percentiles.p10),
      p25: calculatePathMaxDrawdown(percentiles.p25),
      p50: calculatePathMaxDrawdown(percentiles.p50),
    };
  }, [percentiles]);

  // 2. Friction drag
  const friction = useMemo(() => {
    return calculateFrictionDrag(simulationData);
  }, [simulationData]);

  // 3. Sequence risk & depletion
  const depletion = useMemo(() => {
    return calculateDepletionMetrics(simulationData, monthlyWithdrawal, m.initialValue);
  }, [simulationData, monthlyWithdrawal, m.initialValue]);

  // 4. Probability Cone calculations
  const p10Val = percentiles.p10[horizonYears]?.value ?? 0;
  const p25Val = percentiles.p25[horizonYears]?.value ?? 0;
  const p50Val = percentiles.p50[horizonYears]?.value ?? 0;
  const p75Val = percentiles.p75[horizonYears]?.value ?? 0;
  const p90Val = percentiles.p90[horizonYears]?.value ?? 0;

  const normalizedCone = useMemo(() => {
    if (p90Val === 0) return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 100 };
    return {
      p10: (p10Val / p90Val) * 100,
      p25: (p25Val / p90Val) * 100,
      p50: (p50Val / p90Val) * 100,
      p75: (p75Val / p90Val) * 100,
      p90: 100,
    };
  }, [p10Val, p25Val, p50Val, p75Val, p90Val]);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b-2 border-slate-900/5 dark:border-slate-100/5 pb-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-[0.15em]">
            Downside Protection & Stress-Test Audit
          </h3>
        </div>
      </div>

      {/* Downside Grid (Absolute Worst, VaR, CVaR, Best) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Worst Case */}
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-1">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Absolute Worst Case</span>
          <p className="text-base font-extrabold text-rose-500 dark:text-rose-400 leading-tight">
            {formatCurrency(absoluteWorst)}
          </p>
          <p className="text-[9px] text-slate-500 leading-tight">
            The single worst-performing path among {numSims.toLocaleString()} trials.
          </p>
        </div>

        {/* 95% Value at Risk */}
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-1">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Value at Risk (95% VaR)</span>
          <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
            {formatCurrency(m.valueAtRisk95)}
          </p>
          <p className="text-[9px] text-slate-500 leading-tight">
            With 95% confidence, your nominal loss will not exceed this.
          </p>
        </div>

        {/* 95% CVaR */}
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-1">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Expected Shortfall (CVaR)</span>
          <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
            {formatCurrency(m.conditionalValueAtRisk95)}
          </p>
          <p className="text-[9px] text-slate-500 leading-tight">
            If you fall into the worst 5% of cycles, this is your average ending wealth.
          </p>
        </div>

        {/* Worst Drawdown (P10 Path) */}
        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-1">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Bear Peak Drawdown</span>
          <p className="text-base font-extrabold text-amber-500 dark:text-amber-400 leading-tight">
            -{formatPercent(drawdowns.p10)}
          </p>
          <p className="text-[9px] text-slate-500 leading-tight">
            Peak-to-trough drop along your pessimistic (10th percentile) growth path.
          </p>
        </div>
      </div>

      {/* Visual Probability Cone Range Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">Asymmetric Outcome Spectrum</span>
          <span className="text-[10px] text-slate-400">Values scaled up to p90 ({formatCurrency(p90Val)})</span>
        </div>

        <div className="h-10 relative flex items-center">
          {/* Background Track */}
          <div className="absolute inset-x-0 h-3 bg-slate-200 dark:bg-slate-800 rounded-full" />
          
          {/* Outer Cone (10% - 90%) */}
          <div 
            className="absolute h-3 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full"
            style={{ 
              left: `${normalizedCone.p10}%`, 
              right: '0%' 
            }}
          />

          {/* Inner Cone (25% - 75%) */}
          <div 
            className="absolute h-3 bg-indigo-500/50 dark:bg-indigo-500/35 rounded-full"
            style={{ 
              left: `${normalizedCone.p25}%`, 
              right: `${100 - normalizedCone.p75}%` 
            }}
          />

          {/* Median Dot indicator */}
          <div 
            className="absolute w-3.5 h-6 bg-indigo-600 dark:bg-indigo-400 rounded shadow-sm border border-white dark:border-slate-900 -translate-x-1/2 flex items-center justify-center"
            style={{ left: `${normalizedCone.p50}%` }}
            title={`Median: ${formatCurrency(p50Val)}`}
          >
            <div className="w-0.5 h-3 bg-white dark:bg-slate-950" />
          </div>

          {/* Label lines */}
          <span className="absolute text-[8px] font-bold text-slate-400 dark:text-slate-500 bottom-0" style={{ left: `${normalizedCone.p10}%`, transform: 'translateX(-50%) translateY(8px)' }}>
            p10 ({formatCurrency(p10Val)})
          </span>
          <span className="absolute text-[8px] font-bold text-slate-400 dark:text-slate-500 bottom-0" style={{ left: `${normalizedCone.p25}%`, transform: 'translateX(-50%) translateY(8px)' }}>
            p25 ({formatCurrency(p25Val)})
          </span>
          <span className="absolute text-[8px] font-black text-indigo-600 dark:text-indigo-400 top-0" style={{ left: `${normalizedCone.p50}%`, transform: 'translateX(-50%) translateY(-12px)' }}>
            p50 ({formatCurrency(p50Val)})
          </span>
          <span className="absolute text-[8px] font-bold text-slate-400 dark:text-slate-500 bottom-0" style={{ left: `${normalizedCone.p75}%`, transform: 'translateX(-50%) translateY(8px)' }}>
            p75 ({formatCurrency(p75Val)})
          </span>
          <span className="absolute text-[8px] font-bold text-slate-400 dark:text-slate-500 bottom-0" style={{ left: '100%', transform: 'translateX(-100%) translateY(8px)' }}>
            p90 ({formatCurrency(p90Val)})
          </span>
        </div>
        <div className="pt-2" />
      </div>

      {/* Structural Drag & Sequence Risk section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Friction Drag Card */}
        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" /> Friction Drag Scorecard
            </span>
            <div className="flex justify-between items-end">
              <p className="text-lg font-black text-slate-850 dark:text-slate-200">
                {formatCurrency(friction.totalFrictions)}
              </p>
              <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatPercent(friction.dragPercentage)} of final wealth
              </p>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Combines median taxes from rebalancing with transactional fee drag.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/20">
            <div className="h-1.5 bg-slate-200 dark:bg-slate-850 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  friction.dragPercentage > 0.15 
                    ? 'bg-rose-500' 
                    : friction.dragPercentage > 0.08
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(friction.dragPercentage * 400, 100)}%` }} // scale for visual representation (25% max visual scale)
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
              "{friction.commentary}"
            </p>
          </div>
        </div>

        {/* Sequence & Withdrawals Risk Card */}
        {monthlyWithdrawal > 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> Capital Depletion Assessment
              </span>
              <div className="flex justify-between items-end">
                <p className="text-lg font-black text-rose-500">
                  {formatProbability(depletion.depletionProbability, 1)}
                </p>
                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Depletion Probability
                </p>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Chance portfolio hits $0 before Year {horizonYears} due to withdrawals.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/20 text-[10px] leading-normal text-slate-600 dark:text-slate-400">
              <p>
                Your annualized withdrawal rate is <strong className="font-bold text-slate-700 dark:text-slate-300">{formatPercent(depletion.annualWithdrawalRate)}</strong>.
              </p>
              <p className="italic">
                Trinity Guideline Status: <strong className={`font-black ${
                  depletion.annualWithdrawalRate > 0.05 ? 'text-rose-500' : depletion.annualWithdrawalRate > 0.04 ? 'text-amber-500' : 'text-emerald-500'
                }`}>{depletion.trinityStatus}</strong>
              </p>
            </div>
          </div>
        ) : (
          /* Inflation Erosion Card (when withdrawals are 0) */
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Inflation Erosion Alert
              </span>
              <div className="flex justify-between items-end">
                <p className="text-lg font-black text-slate-850 dark:text-slate-200">
                  {formatCurrency(p50Val / Math.pow(1.03, horizonYears))}
                </p>
                <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                  Real Median Value (3% Inflation)
                </p>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Erosion of purchasing power over a {horizonYears}-year holding window.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/20 text-[10px] leading-normal text-slate-500 dark:text-slate-400 italic">
              {!adjustInflation ? (
                <>Warning: You are currently viewing nominal baseline metrics. Enforce 'Real Inflation Drag' to reflect true future purchasing power.</>
              ) : (
                <>Inflation compensation is fully enabled. All charted cones reflect constant Year-0 purchasing power.</>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
