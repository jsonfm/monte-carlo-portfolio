import { useState, useMemo } from 'react';
import { 
  FileText, Clipboard, Check, TrendingUp, ShieldAlert, Sparkles, 
  Target, ChevronRight, Award, DollarSign, ShieldCheck
} from 'lucide-react';
import type { Asset, SimulationSummary } from '@/types';
import InfoTooltip from '@/components/InfoTooltip';

interface SimulationReportProps {
  simulationData: SimulationSummary | null;
  assets: Asset[];
  loading: boolean;
}

const EMPTY_METRICS: SimulationSummary['metrics'] = {
  initialValue: 0,
  medianFinalValue: 0,
  expectedCagr: 0,
  volatility: 0,
  sharpeRatio: 0,
  sortinoRatio: 0,
  valueAtRisk95: 0,
  conditionalValueAtRisk95: 0,
  probabilityOfLoss: 0,
  probabilityOfTarget: 0,
};

const EMPTY_PERCENTILES: SimulationSummary['percentiles'] = {
  p10: [{ year: 0, value: 0 }],
  p25: [{ year: 0, value: 0 }],
  p50: [{ year: 0, value: 0 }],
  p75: [{ year: 0, value: 0 }],
  p90: [{ year: 0, value: 0 }],
};

const EMPTY_FINAL_VALUES: number[] = [];

export function SimulationReport({
  simulationData,
  assets,
  loading,
}: SimulationReportProps) {
  const [copied, setCopied] = useState(false);
  const [customGoal, setCustomGoal] = useState<string>('');

  const percentiles = simulationData?.percentiles ?? EMPTY_PERCENTILES;
  const finalValues = simulationData?.finalValues ?? EMPTY_FINAL_VALUES;
  const metrics = simulationData?.metrics ?? EMPTY_METRICS;
  const horizonYears = simulationData ? percentiles.p50.length - 1 : 0;
  const numSims = finalValues.length;

  // Basic formatters
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

  // 1. Classify Portfolio Profile
  const portfolioProfile = useMemo(() => {
    const cryptoWeight = assets.filter(a => a.type === 'crypto').reduce((sum, a) => sum + a.weight, 0);
    const stockWeight = assets.filter(a => a.type === 'stock' || a.type === 'etf').reduce((sum, a) => sum + a.weight, 0);
    const bondWeight = assets.filter(a => a.type === 'bond').reduce((sum, a) => sum + a.weight, 0);

    let profileName = "Balanced Profile";
    let badgeColor = "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
    let riskTier = "Moderate";
    let description = "A balanced mix designed to capture steady growth while dampening market volatility.";

    if (cryptoWeight > 20) {
      profileName = "Speculative Crypto-Heavy";
      badgeColor = "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400";
      riskTier = "Very High";
      description = "Aggressive allocation with significant cryptocurrency exposure. Designed for explosive returns but carries severe tail-risk.";
    } else if (stockWeight > 80) {
      profileName = "Aggressive Growth";
      badgeColor = "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
      riskTier = "High";
      description = "Primarily equities or equity ETFs. Positions your capital for maximum compounding over long horizons, accepting large drawdowns.";
    } else if (bondWeight > 60) {
      profileName = "Conservative Income";
      badgeColor = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
      riskTier = "Low";
      description = "Heavy bond exposure aimed at capital preservation and predictable income. Low risk of nominal losses, but vulnerable to inflation.";
    } else if (stockWeight > 45 && bondWeight > 30) {
      profileName = "Moderate Growth & Income";
      badgeColor = "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400";
      riskTier = "Medium";
      description = "Classic core allocation balanced between capital appreciation and defensive safety.";
    } else if (stockWeight > 30 && bondWeight > 45) {
      profileName = "Conservative Balanced";
      badgeColor = "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400";
      riskTier = "Low-Medium";
      description = "Slight growth tilt but firmly anchored in fixed-income protection to smooth out turbulent market waves.";
    }

    return { profileName, badgeColor, riskTier, description };
  }, [assets]);

  // 2. Compute Scenario Details (Percentile outcomes at Horizon)
  const scenarios = useMemo(() => {
    if (!simulationData) return [];

    const endP10 = percentiles.p10[horizonYears].value;
    const endP25 = percentiles.p25[horizonYears].value;
    const endP50 = percentiles.p50[horizonYears].value;
    const endP75 = percentiles.p75[horizonYears].value;
    const endP90 = percentiles.p90[horizonYears].value;

    const calculateCagr = (start: number, end: number, years: number) => {
      if (end <= 0) return -1;
      return Math.pow(end / start, 1 / years) - 1;
    };

    return [
      {
        id: 'p90',
        name: 'Optimistic (90th Percentile)',
        desc: 'Top-tier performance matching a secular bull run.',
        value: endP90,
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
        returnPct: (endP75 - metrics.initialValue) / metrics.initialValue,
        multiplier: endP75 / metrics.initialValue,
        cagr: calculateCagr(metrics.initialValue, endP75, horizonYears),
        color: 'text-teal-600 dark:text-teal-400',
        barColor: 'bg-teal-500',
      },
      {
        id: 'p50',
        name: 'Median Expected (50th Percentile)',
        desc: 'The baseline middle outcome (equal odds above or below).',
        value: endP50,
        returnPct: (endP50 - metrics.initialValue) / metrics.initialValue,
        multiplier: endP50 / metrics.initialValue,
        cagr: calculateCagr(metrics.initialValue, endP50, horizonYears),
        color: 'text-purple-600 dark:text-purple-400',
        barColor: 'bg-purple-500',
      },
      {
        id: 'p25',
        name: 'Conservative (25th Percentile)',
        desc: 'Lagging performance under standard correction years.',
        value: endP25,
        returnPct: (endP25 - metrics.initialValue) / metrics.initialValue,
        multiplier: endP25 / metrics.initialValue,
        cagr: calculateCagr(metrics.initialValue, endP25, horizonYears),
        color: 'text-amber-600 dark:text-amber-500',
        barColor: 'bg-amber-500',
      },
      {
        id: 'p10',
        name: 'Pessimistic (10th Percentile)',
        desc: 'Severe economic downturn or secular bear market.',
        value: endP10,
        returnPct: (endP10 - metrics.initialValue) / metrics.initialValue,
        multiplier: endP10 / metrics.initialValue,
        cagr: calculateCagr(metrics.initialValue, endP10, horizonYears),
        color: 'text-rose-600 dark:text-rose-400',
        barColor: 'bg-rose-500',
      },
    ];
  }, [simulationData, percentiles, horizonYears, metrics.initialValue]);

  // 3. Probabilistic Milestones
  const milestones = useMemo(() => {
    if (!simulationData || numSims === 0) return [];

    const calcProb = (targetMult: number) => {
      const count = finalValues.filter(v => v >= metrics.initialValue * targetMult).length;
      return count / numSims;
    };

    return [
      { name: 'Capital Preservation (1x)', target: 1.0, prob: calcProb(1.0), icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-500/10' },
      { name: 'Moderate Growth (1.5x)', target: 1.5, prob: calcProb(1.5), icon: TrendingUp, color: 'text-blue-500 bg-blue-500/10' },
      { name: 'Double Capital (2x)', target: 2.0, prob: calcProb(2.0), icon: Sparkles, color: 'text-purple-500 bg-purple-500/10' },
      { name: 'Triple Capital (3x)', target: 3.0, prob: calcProb(3.0), icon: Award, color: 'text-amber-500 bg-amber-500/10' },
      { name: 'Super compounding (5x)', target: 5.0, prob: calcProb(5.0), icon: Target, color: 'text-rose-500 bg-rose-500/10' },
    ];
  }, [simulationData, finalValues, metrics.initialValue, numSims]);

  // 4. Custom Goal Solver calculations
  const goalTarget = parseFloat(customGoal.replace(/[^0-9.]/g, ''));
  const goalProbability = useMemo(() => {
    if (!simulationData || isNaN(goalTarget) || goalTarget <= 0 || numSims === 0) return null;
    const achieved = finalValues.filter(v => v >= goalTarget).length;
    return achieved / numSims;
  }, [simulationData, finalValues, goalTarget, numSims]);

  // 5. Tail Risk Stats
  const absoluteWorst = finalValues[0] ?? 0;
  const absoluteBest = finalValues[finalValues.length - 1] ?? 0;
  const breakEvenLossProb = metrics.probabilityOfLoss;

  // 6. Generate Dynamic Summary Text
  const dynamicNarrativeSummary = useMemo(() => {
    if (!simulationData || scenarios.length < 3) return '';

    const medianMultiplier = (scenarios[2].value / metrics.initialValue).toFixed(1);
    
    const lossProbabilityText = breakEvenLossProb < 0.01 
      ? 'less than 1%' 
      : `about **${formatProbability(breakEvenLossProb, 0)}**`;

    const preservationProbText = (1 - breakEvenLossProb) >= 0.99
      ? 'a **greater than 99%**'
      : `a **${formatProbability(1 - breakEvenLossProb, 0)}**`;

    const isHighRisk = portfolioProfile.riskTier === 'Very High' || portfolioProfile.riskTier === 'High' || assets.some(a => a.type === 'crypto');
    const safetyNote = isHighRisk
      ? breakEvenLossProb < 0.05
        ? `While the long-term simulation shows a very high probability of capital preservation due to historical growth trends, this portfolio remains subject to extreme interim volatility and significant tail-risk. It is highly suited for long-term investors who can withstand major drawdowns.`
        : `Due to the high-risk and speculative exposure of your portfolio, significant drawdowns are expected. Special care should be taken to ensure your investment horizon is strictly long-term so that short-term volatility doesn't force premature liquidation.`
      : breakEvenLossProb < 0.08
        ? `The low probability of capital loss over this horizon highlights the historically defensive nature of your balanced allocation, providing a strong foundation for capital preservation.`
        : `This represents a moderate risk profile where brief cycles of negative returns are expected but historically tend to smooth out over a multi-year horizon.`;

    return `This portfolio is classified as a **${portfolioProfile.profileName}** with a **${portfolioProfile.riskTier}** risk profile. Over the next **${horizonYears} years**, the median expectation is that your initial investment of **${formatCurrency(metrics.initialValue)}** will multiply by **${medianMultiplier}x**, yielding a projected final balance of **${formatCurrency(scenarios[2].value)}** (annualized CAGR of **${formatPercent(scenarios[2].cagr)}**). There is ${preservationProbText} probability of preserving your principal, meaning the chance of ending with less than you started is ${lossProbabilityText}. ${safetyNote}`;
  }, [simulationData, portfolioProfile, horizonYears, metrics, scenarios, breakEvenLossProb, assets]);

  if (loading && !simulationData) {
    return (
      <div className="bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/40 rounded-3xl p-6 shadow-sm transition-colors flex flex-col items-center justify-center h-48">
        <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider animate-pulse">
          Synthesizing Simulation Report...
        </p>
      </div>
    );
  }

  if (!simulationData) {
    return null;
  }

  // 7. Copy text summary function
  const copyToClipboard = () => {
    const assetString = assets.map(a => ` - ${a.ticker}: ${a.weight}%`).join('\n');
    const scenariosString = scenarios.map(s => ` - ${s.name}: ${formatCurrency(s.value)} (${formatPercent(s.cagr)} CAGR, ${s.multiplier.toFixed(2)}x)`).join('\n');
    const milestonesString = milestones.map(m => ` - ${m.name}: ${formatProbability(m.prob, 0)} probability`).join('\n');

    const reportText = `=========================================
MONTE CARLO SIMULATION EXECUTIVE REPORT
=========================================
Horizon: ${horizonYears} Years
Simulations Run: ${numSims.toLocaleString()} Trials
Initial Capital: ${formatCurrency(metrics.initialValue)}

PORTFOLIO STRUCTURE:
${assetString}

RISK CLASSIFICATION:
Profile: ${portfolioProfile.profileName}
Risk Tier: ${portfolioProfile.riskTier}
Description: ${portfolioProfile.description}

EXECUTIVE SUMMARY:
${dynamicNarrativeSummary.replace(/\*\*/g, '')}

PROJECTED SCENARIO ANALYSIS (PERCENTILES):
${scenariosString}

PROBABILISTIC MILESTONES:
${milestonesString}

TAIL-RISK ANALYSIS:
 - Absolute Worst Simulated Value: ${formatCurrency(absoluteWorst)}
 - 95% Value at Risk (VaR): ${formatCurrency(metrics.valueAtRisk95)} (Max loss expected with 95% confidence)
 - 95% Conditional VaR (CVaR): ${formatCurrency(metrics.conditionalValueAtRisk95)} (Average worst-5% outcomes)
 - Absolute Best Simulated Value: ${formatCurrency(absoluteBest)}
=========================================
Generated on ${new Date().toLocaleDateString()}
    `;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-sm dark:shadow-xl space-y-6 transition-colors">
      
      {/* Report Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none uppercase">
              Simulation Executive Report
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Probabilistic statistics compiled across {numSims.toLocaleString()} simulation trials
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <button
          type="button"
          onClick={copyToClipboard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm uppercase tracking-wider cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
            </>
          ) : (
            <>
              <Clipboard className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Copy Text Report
            </>
          )}
        </button>
      </div>

      {/* 2-Column Section: Profile Card + Dynamic Summary Paragraph */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Risk Profile Panel (4/12 cols) */}
        <div className="md:col-span-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4.5 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Portfolio Identity</span>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5 leading-tight">
              {portfolioProfile.profileName}
            </h4>
            
            <div className="flex gap-2 items-center mt-2.5">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${portfolioProfile.badgeColor}`}>
                {portfolioProfile.riskTier} Risk
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Horizon: {horizonYears} Years
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic border-t border-slate-200 dark:border-slate-800/40 pt-3">
            "{portfolioProfile.description}"
          </p>
        </div>

        {/* Narrative Summary (8/12 cols) */}
        <div className="md:col-span-8 bg-slate-50 dark:bg-slate-900/10 border border-slate-150 dark:border-slate-800/20 rounded-2xl p-4.5">
          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" /> Advisor Insights & Commentary
          </span>
          <p 
            className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: dynamicNarrativeSummary
                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-slate-800 dark:text-slate-100">$1</strong>')
            }}
          />
        </div>
      </div>

      {/* Main Stats Segment: Scenarios Table + Progress Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Scenarios Table (7/12 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Projected Scenarios (Ending Percentiles)
            </h3>
            <InfoTooltip content="Specific outcome bands reflecting various market realities. Median represents normal trend, while Optimistic/Pessimistic represent 90th and 10th percentiles." />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-4">Scenario</th>
                    <th className="py-2.5 px-3 text-right">Ending Value</th>
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
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-3.5 rounded ${scen.barColor}`} />
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
                      <td className={`py-3.5 px-3 text-right font-bold ${
                        scen.returnPct >= 0 
                          ? 'text-emerald-500 dark:text-emerald-400' 
                          : 'text-rose-500 dark:text-rose-400'
                      }`}>
                        {scen.returnPct >= 0 ? '+' : ''}{formatPercent(scen.returnPct)}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal block">
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

        {/* Right Side: Milestones (5/12 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-1">
            <Award className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Simulation Milestone Probabilities
            </h3>
            <InfoTooltip content="The mathematical probability that your portfolio value touches or exceeds specific multipliers of your starting principal." />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 space-y-3.5">
            {milestones.map((mil, idx) => {
              const Icon = mil.icon;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-2 font-extrabold text-slate-700 dark:text-slate-300">
                      <div className={`p-1.5 rounded-lg ${mil.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {mil.name}
                    </span>
                    <span className="font-black text-slate-800 dark:text-slate-100 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {formatProbability(mil.prob, 0)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/40">
                    <div 
                      className={`h-full bg-gradient-to-r rounded-full transition-all duration-700 ${
                        mil.prob > 0.7 
                          ? 'from-emerald-400 to-emerald-500 dark:from-emerald-500/80 dark:to-emerald-500' 
                          : mil.prob > 0.4
                          ? 'from-indigo-400 to-indigo-500 dark:from-indigo-500/80 dark:to-indigo-500'
                          : mil.prob > 0.15
                          ? 'from-amber-400 to-amber-500 dark:from-amber-500/80 dark:to-amber-500'
                          : 'from-rose-400 to-rose-500 dark:from-rose-500/80 dark:to-rose-500'
                      }`}
                      style={{ width: `${mil.prob * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Goal Probability Solver Card */}
      <div className="bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-950/10 dark:to-purple-950/10 border border-indigo-200/60 dark:border-indigo-900/30 rounded-2xl p-4.5 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
              <Target className="w-4 h-4 text-indigo-500 dark:text-indigo-400 animate-pulse" /> Custom Goal Probability Solver
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Wondering if this portfolio can fund a down payment or meet a specific target? Input any custom dollar goal, and we'll instantly calculate the estimated probability of achieving it based on raw simulation distribution.
            </p>
          </div>

          {/* Goal Input & Probability Output */}
          <div className="flex flex-wrap gap-4 items-center shrink-0">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="e.g., 50,000"
                className="pl-8 pr-3 py-2 w-40 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Calculated Goal Result badge */}
            <div className="h-10 px-4 flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl min-w-[150px] justify-between shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-2">Probability</span>
              {goalProbability !== null ? (
                <span className={`text-sm font-black ${
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
                <span className="text-xs text-slate-400 italic">Enter amount</span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Goal statement */}
        {goalProbability !== null && (
          <div className="mt-4 pt-3.5 border-t border-indigo-100 dark:border-indigo-950 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <ChevronRight className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              The simulation estimates {goalProbability >= 0.99 ? 'a **greater than 99%**' : goalProbability <= 0.01 && goalProbability > 0 ? 'a **less than 1%**' : `a **${formatProbability(goalProbability, 1)}**`} probability that your portfolio will achieve or exceed <strong className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(goalTarget)}</strong> by Year {horizonYears}.
            </span>
          </div>
        )}
      </div>

      {/* Downside & Tail Risk Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-500 dark:text-rose-400" />
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Downside Protection & Tail-Risk Metrics
          </h3>
          <InfoTooltip content="Advanced institutional risk assessments evaluating extreme negative market conditions and extreme outlier walks." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Minimum Simulated Value */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Absolute Worst Case</span>
            <p className="text-base font-extrabold text-rose-500 dark:text-rose-400 leading-tight">
              {formatCurrency(absoluteWorst)}
            </p>
            <p className="text-[9px] text-slate-500 leading-tight">
              The single worst-performing path among {numSims.toLocaleString()} trials.
            </p>
          </div>

          {/* 95% Value at Risk */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">95% Value at Risk (VaR)</span>
            <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
              {formatCurrency(metrics.valueAtRisk95)}
            </p>
            <p className="text-[9px] text-slate-500 leading-tight">
              With 95% confidence, your losses won't exceed this from your starting principal.
            </p>
          </div>

          {/* 95% Conditional Value at Risk */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">95% Expected Shortfall (CVaR)</span>
            <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
              {formatCurrency(metrics.conditionalValueAtRisk95)}
            </p>
            <p className="text-[9px] text-slate-500 leading-tight">
              If you fall into the worst 5% of cycles, this is the average expected loss.
            </p>
          </div>

          {/* Maximum Simulated Value */}
          <div className="bg-slate-50 dark:bg-slate-900/30 p-3.5 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Absolute Best Case</span>
            <p className="text-base font-extrabold text-emerald-500 dark:text-emerald-400 leading-tight">
              {formatCurrency(absoluteBest)}
            </p>
            <p className="text-[9px] text-slate-500 leading-tight">
              The single best-performing path among {numSims.toLocaleString()} trials.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
