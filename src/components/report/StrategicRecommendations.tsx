import { useMemo } from 'react';
import { Compass, AlertTriangle, AlertCircle, Info, Sparkles, CheckCircle } from 'lucide-react';
import type { Asset, SimulationSummary, HistoricalMetrics } from '@/types';
import { generateInstitutionalRecommendations } from '@/utils/reportInsights';
import type { RecommendationCard } from '@/utils/reportInsights';

interface StrategicRecommendationsProps {
  assets: Asset[];
  horizonYears: number;
  simulationData: SimulationSummary;
  historicalData: HistoricalMetrics | null;
  rebalanceFrequency: string;
  useMertonJumps: boolean;
  monthlyWithdrawal: number;
  adjustInflation: boolean;
}

export function StrategicRecommendations({
  assets,
  horizonYears,
  simulationData,
  historicalData,
  rebalanceFrequency,
  useMertonJumps,
  monthlyWithdrawal,
  adjustInflation,
}: StrategicRecommendationsProps) {
  const recommendations = useMemo(() => {
    const bondWeight = assets.filter(a => a.type === 'bond').reduce((sum, a) => sum + a.weight, 0);
    const initialInvestment = simulationData.metrics.initialValue;

    return generateInstitutionalRecommendations({
      assets,
      horizonYears,
      simulationData,
      historicalMetrics: historicalData,
      rebalanceFrequency,
      useMertonJumps,
      monthlyWithdrawal,
      adjustInflation,
      initialInvestment,
      bondWeight,
    });
  }, [
    assets,
    horizonYears,
    simulationData,
    historicalData,
    rebalanceFrequency,
    useMertonJumps,
    monthlyWithdrawal,
    adjustInflation,
  ]);

  const severityStyles = {
    critical: {
      card: 'bg-rose-500/5 border-rose-500/20 text-rose-800 dark:text-rose-400',
      badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: <AlertCircle className="w-4.5 h-4.5 text-rose-500" />,
    },
    warning: {
      card: 'bg-amber-500/5 border-amber-500/20 text-amber-800 dark:text-amber-400',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />,
    },
    info: {
      card: 'bg-blue-500/5 border-blue-500/20 text-blue-800 dark:text-blue-400',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: <Info className="w-4.5 h-4.5 text-blue-500" />,
    },
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b-2 border-slate-900/5 dark:border-slate-100/5 pb-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Compass className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-[0.15em]">
            Portfolio Analysis & Considerations
          </h3>
        </div>
      </div>

      {recommendations.length === 0 ? (
        /* Empty State / Highly Optimized portfolio */
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center space-y-3">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Allocation Model Consistent</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              The current allocation model meets the general baseline guidelines with no specific risk flags or asset concentrations identified.
            </p>
          </div>
        </div>
      ) : (
        /* Render Consideration cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => {
            const style = severityStyles[rec.type];
            return (
              <div 
                key={rec.id} 
                className={`border rounded-2xl p-4.5 flex flex-col justify-between space-y-3.5 transition-colors ${style.card}`}
              >
                {/* Body */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{style.icon}</div>
                    <div className="space-y-0.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${style.badge}`}>
                        {rec.type}
                      </span>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1.5 leading-tight">
                        {rec.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                    {rec.description}
                  </p>
                </div>

                {/* Impact footnote if available */}
                {rec.impact && (
                  <div className="border-t border-slate-200/40 dark:border-slate-800/40 pt-2.5 pl-7 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      <strong className="font-bold text-indigo-600 dark:text-indigo-400">Potential Impact:</strong> {rec.impact}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
export type { RecommendationCard };
export { generateInstitutionalRecommendations };
