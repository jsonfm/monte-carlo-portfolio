import { useMemo } from 'react';
import { Target, DollarSign, ChevronRight, Scale, Clock } from 'lucide-react';
import type { SimulationSummary } from '@/types';
import { 
  formatCurrency, 
  formatProbability, 
  solveRequiredCapital 
} from '@/utils/reportInsights';

interface GoalSolverProps {
  simulationData: SimulationSummary;
  horizonYears: number;
  customGoal: string;
  setCustomGoal: (val: string) => void;
}

export function GoalSolver({
  simulationData,
  horizonYears,
  customGoal,
  setCustomGoal,
}: GoalSolverProps) {
  const finalValues = simulationData.finalValues;
  const numSims = finalValues.length;

  const m = simulationData.metrics;

  // 1. Calculate target probabilities and reverse solve
  const goalTarget = useMemo(() => {
    const parsed = parseFloat(customGoal.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) || parsed <= 0 ? null : parsed;
  }, [customGoal]);

  const goalProbability = useMemo(() => {
    if (numSims === 0 || !goalTarget) return null;
    const achieved = finalValues.filter(v => v >= goalTarget).length;
    return achieved / numSims;
  }, [finalValues, goalTarget, numSims]);

  // Reverse solve required capital for 80% confidence interval (p20/p25 barrier)
  const suggestedStartingCapital = useMemo(() => {
    if (!goalTarget) return null;
    return solveRequiredCapital(simulationData, goalTarget);
  }, [simulationData, goalTarget]);

  // Reverse solve crossing year (first year median matches or exceeds target)
  const medianCrossingYear = useMemo(() => {
    if (!goalTarget) return null;
    const p50 = simulationData.percentiles.p50;
    for (let i = 0; i < p50.length; i++) {
      if (p50[i].value >= goalTarget) {
        return p50[i].year;
      }
    }
    return null;
  }, [simulationData, goalTarget]);

  return (
    <div className="bg-white dark:bg-slate-900/40 border-2 border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] p-6 sm:p-8 shadow-sm">
      
      {/* Grid wrapper */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        
        {/* Input & Explanation */}
        <div className="space-y-3 max-w-lg">
          <span className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm font-bold uppercase tracking-[0.15em]">
            <Target className="w-5 h-5 animate-pulse" /> Custom Goal Probability Solver
          </span>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Wondering if this portfolio can fund a down payment or meet a specific target? Input any custom dollar goal, and we'll instantly calculate the estimated probability of achieving it based on raw simulation distribution.
          </p>
        </div>

        {/* Input box */}
        <div className="flex flex-wrap gap-4 items-center shrink-0 w-full md:w-auto">
          <div className="relative flex-1 md:flex-initial">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="e.g., 250,000"
              className="pl-8 pr-3 py-2 w-full md:w-40 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="h-10 px-4 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl min-w-[140px] justify-between shadow-sm flex-1 md:flex-initial">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-2">Probability</span>
            {goalProbability !== null ? (
              <span className={`text-xs font-black ${
                goalProbability > 0.7 
                  ? 'text-emerald-500 dark:text-emerald-400' 
                  : goalProbability > 0.4
                  ? 'text-indigo-500 dark:text-indigo-400'
                  : goalProbability > 0.15
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-rose-500 dark:text-rose-400'
              }`}>
                {formatProbability(goalProbability, 1)}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 italic">Enter amount</span>
            )}
          </div>
        </div>

      </div>

      {/* Solver Analytical Cards */}
      {goalProbability !== null && goalTarget && (
        <div className="mt-5 space-y-4 pt-4 border-t border-indigo-100 dark:border-indigo-950/60">
          
          {/* Main Statement */}
          <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-normal">
            <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              The simulation estimates {goalProbability >= 0.99 ? 'a **greater than 99%**' : goalProbability <= 0.01 && goalProbability > 0 ? 'a **less than 1%**' : `a **${formatProbability(goalProbability, 1)}**`} probability that your portfolio will achieve or exceed <strong className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(goalTarget)}</strong> by Year {horizonYears}.
            </span>
          </div>

          {/* Reverse Solved Solutions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Required Starting Capital card */}
            <div className="bg-white/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/40 rounded-xl p-4 flex gap-3.5 items-start">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-lg shrink-0">
                <Scale className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <span className="text-[8px] text-slate-400 uppercase font-semibold block">Capital Requirement Analysis</span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {suggestedStartingCapital ? formatCurrency(suggestedStartingCapital) : 'N/A'}
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Estimated starting capital that would align with an <strong className="font-bold">80% simulated probability</strong> of achieving the goal (compared to current {formatCurrency(m.initialValue)}).
                </p>
              </div>
            </div>

            {/* Estimated Crossing Year card */}
            <div className="bg-white/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/40 rounded-xl p-4 flex gap-3.5 items-start">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-lg shrink-0">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div className="space-y-1">
                <span className="text-[8px] text-slate-400 uppercase font-semibold block">Estimated Horizon Match</span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                  {medianCrossingYear !== null ? `Year ${medianCrossingYear}` : 'Beyond Horizon'}
                </p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  The year in which your median (50th percentile) expected outcome path first crosses your target.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
