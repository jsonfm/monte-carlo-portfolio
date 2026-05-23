import { useMemo } from 'react';
import { Sparkles, ShieldCheck, ShieldAlert, Award } from 'lucide-react';
import type { Asset, SimulationSummary, HistoricalMetrics } from '@/types';
import { formatCurrency, formatPercent, formatProbability } from '@/utils/reportInsights';

interface ExecutiveSummaryProps {
  simulationData: SimulationSummary;
  historicalData: HistoricalMetrics | null;
  assets: Asset[];
  horizonYears: number;
}

export function ExecutiveSummary({
  simulationData,
  historicalData,
  assets,
  horizonYears,
}: ExecutiveSummaryProps) {
  const m = simulationData.metrics;

  // 1. Classify Portfolio Profile
  const profile = useMemo(() => {
    const cryptoWeight = assets.filter(a => a.type === 'crypto').reduce((sum, a) => sum + a.weight, 0);
    const stockWeight = assets.filter(a => a.type === 'stock' || a.type === 'etf').reduce((sum, a) => sum + a.weight, 0);
    const bondWeight = assets.filter(a => a.type === 'bond').reduce((sum, a) => sum + a.weight, 0);

    let profileName = "Balanced Profile";
    let badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900";
    let riskTier: 'Low' | 'Medium' | 'High' | 'Very High' = "Medium";
    let description = "A balanced mix designed to capture steady growth while dampening market volatility.";
    let focus: 'Growth' | 'Balanced' | 'Defensive' | 'Speculative' = 'Balanced';

    if (cryptoWeight > 20) {
      profileName = "Speculative Crypto-Heavy";
      badgeColor = "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-900";
      riskTier = "Very High";
      description = "Aggressive allocation with significant cryptocurrency exposure. Designed for explosive returns but carries severe tail-risk.";
      focus = 'Speculative';
    } else if (stockWeight > 80) {
      profileName = "Aggressive Growth";
      badgeColor = "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900";
      riskTier = "High";
      description = "Primarily equities or equity ETFs. Positions your capital for maximum compounding over long horizons, accepting large drawdowns.";
      focus = 'Growth';
    } else if (bondWeight > 60) {
      profileName = "Conservative Income";
      badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900";
      riskTier = "Low";
      description = "Heavy bond exposure aimed at capital preservation and predictable income. Low risk of nominal losses, but vulnerable to inflation.";
      focus = 'Defensive';
    } else if (stockWeight > 45 && bondWeight > 30) {
      profileName = "Moderate Growth & Income";
      badgeColor = "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900";
      riskTier = "Medium";
      description = "Classic core allocation balanced between capital appreciation and defensive safety.";
      focus = 'Balanced';
    } else if (stockWeight > 30 && bondWeight > 45) {
      profileName = "Conservative Balanced";
      badgeColor = "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-teal-200 dark:border-teal-900";
      riskTier = "Low";
      description = "Slight growth tilt but firmly anchored in fixed-income protection to smooth out turbulent market waves.";
      focus = 'Defensive';
    }

    return { profileName, badgeColor, riskTier, description, focus };
  }, [assets]);

  const medianMultiplier = (m.medianFinalValue / m.initialValue).toFixed(1);
  const endP10 = simulationData.percentiles.p10[horizonYears]?.value ?? 0;
  const endP75 = simulationData.percentiles.p75[horizonYears]?.value ?? 0;

  const focusColors = {
    Growth: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Balanced: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Defensive: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Speculative: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600 dark:bg-indigo-500"></div>
        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-indigo-500/5 to-transparent pointer-events-none"></div>
        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-[0.2em] block mb-2">Primary Conclusion</span>
        <h3 className="text-lg sm:text-xl md:text-2xl font-light text-slate-800 dark:text-slate-100 mt-0.5 leading-snug tracking-tight">
          Your portfolio is projected to multiply your capital by <span className="font-bold">{medianMultiplier}x</span> over <span className="font-bold">{horizonYears} years</span>, with a <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatProbability(1 - m.probabilityOfLoss, 0)}</span> probability of capital preservation.
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-stretch">
        {/* Left Card: Risk Profile */}
        <div className="md:col-span-5 lg:col-span-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] block mb-2">Portfolio Identity</span>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-1 leading-tight">
              {profile.profileName}
            </h4>
            
            <div className="flex flex-wrap gap-2 items-center mt-4">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${profile.badgeColor}`}>
                {profile.riskTier} Risk
              </span>
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${focusColors[profile.focus]}`}>
                {profile.focus} Focus
              </span>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80">
            "{profile.description}"
          </p>
        </div>

        {/* Right: Rich Quantitative Narrative */}
        <div className="md:col-span-7 lg:col-span-8 p-1 sm:p-4">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] flex items-center gap-2 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quantitative Analysis
          </span>
          <div className="text-[13px] sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 font-medium">
            <p>
              Based on quantitative simulation modeling, this allocation demonstrates a <strong className="font-bold text-slate-900 dark:text-slate-100">{profile.riskTier}</strong> risk profile. Under baseline simulated conditions (the 50th percentile), the initial capital of <strong className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(m.initialValue)}</strong> is projected to compound at an annualized CAGR of <strong className="font-bold text-slate-900 dark:text-slate-100">{formatPercent(m.expectedCagr)}</strong>, resulting in a projected median balance of <strong className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(m.medianFinalValue)}</strong> over the {horizonYears}-year window.
            </p>
            <p>
              From a downside perspective, there is a <strong className="font-bold text-slate-900 dark:text-slate-100">{formatProbability(1 - m.probabilityOfLoss, 1)}</strong> simulated probability that the final nominal value matches or exceeds the starting cost basis. Conversely, the projected probability of nominal loss is <strong className="font-bold text-slate-900 dark:text-slate-100">{formatProbability(m.probabilityOfLoss, 1)}</strong>. This suggests a structure that, in historical contexts, has demonstrated a capacity to absorb cyclical drawdowns.
            </p>
            <p>
              Under highly favorable market regimes (the 75th percentile), we expect capital to compound to <strong className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(endP75)}</strong>. However, during severe, persistent macroeconomic recessions (the 10th percentile), the final portfolio value could be squeezed to <strong className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(endP10)}</strong>. This asymmetric relationship shows that while the portfolio holds potential for growth, holding period duration is an important factor in managing the risk of having to liquidate assets during market downturns.
            </p>
          </div>
        </div>
      </div>

      {/* Pull quote "Bottom Line" Box */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-5">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 shrink-0 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <Award className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] block">Strategic Takeaway</span>
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
            Based on historical and simulated patterns, this structure functions as a long-term compounding profile. For capital efficiency, systematic rebalancing may help mitigate portfolio drift, particularly when higher-volatility components (such as digital assets or speculative positions) undergo large price fluctuations.
          </p>
        </div>
      </div>
    </div>
  );
}
