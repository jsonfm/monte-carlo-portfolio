import { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, Coins, TrendingUp, Sparkles, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { PRESET_BENCHMARKS } from '@/services/dataService';
import InfoTooltip from '@/components/InfoTooltip';
import type { HistoricalRange } from '@/types';

interface SimulationControlsProps {
  initialInvestment: number;
  setInitialInvestment: (v: number) => void;
  horizonYears: number;
  setHorizonYears: (v: number) => void;
  simulationsCount: number;
  setSimulationsCount: (v: number) => void;
  model: 'gbm' | 'bootstrap';
  setModel: (v: 'gbm' | 'bootstrap') => void;
  rebalanceFrequency: 'none' | 'monthly' | 'annually' | 'threshold';
  setRebalanceFrequency: (v: 'none' | 'monthly' | 'annually' | 'threshold') => void;
  benchmarkTicker: string;
  setBenchmarkTicker: (v: string) => void;
  historicalRange: HistoricalRange;
  setHistoricalRange: (v: HistoricalRange) => void;
  monthlyContribution: number;
  setMonthlyContribution: (v: number) => void;
  monthlyWithdrawal: number;
  setMonthlyWithdrawal: (v: number) => void;
  adjustInflation: boolean;
  setAdjustInflation: (v: boolean) => void;
  annualInflationRate: number;
  setAnnualInflationRate: (v: number) => void;
  isTaxable: boolean;
  setIsTaxable: (v: boolean) => void;
  capitalGainsTaxRate: number;
  setCapitalGainsTaxRate: (v: number) => void;
  transactionFeeRate: number;
  setTransactionFeeRate: (v: number) => void;
  rebalanceThreshold: number;
  setRebalanceThreshold: (v: number) => void;
  bootstrapBlockSize: number;
  setBootstrapBlockSize: (v: number) => void;
  useGarch: boolean;
  setUseGarch: (v: boolean) => void;
  useMertonJumps: boolean;
  setUseMertonJumps: (v: boolean) => void;
  onRunSimulation: () => void;
  onReset: () => void;
  isValid: boolean;
  loading: boolean;
}

export function SimulationControls({
  initialInvestment,
  setInitialInvestment,
  horizonYears,
  setHorizonYears,
  simulationsCount,
  setSimulationsCount,
  model,
  setModel,
  rebalanceFrequency,
  setRebalanceFrequency,
  benchmarkTicker,
  setBenchmarkTicker,
  historicalRange,
  setHistoricalRange,
  monthlyContribution,
  setMonthlyContribution,
  monthlyWithdrawal,
  setMonthlyWithdrawal,
  adjustInflation,
  setAdjustInflation,
  annualInflationRate,
  setAnnualInflationRate,
  isTaxable,
  setIsTaxable,
  capitalGainsTaxRate,
  setCapitalGainsTaxRate,
  transactionFeeRate,
  setTransactionFeeRate,
  rebalanceThreshold,
  setRebalanceThreshold,
  bootstrapBlockSize,
  setBootstrapBlockSize,
  useGarch,
  setUseGarch,
  useMertonJumps,
  setUseMertonJumps,
  onRunSimulation,
  onReset,
  isValid,
  loading,
}: SimulationControlsProps) {
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  return (
    <div className="space-y-5 bg-slate-50 dark:bg-slate-900/10 p-3.5 sm:p-5 border border-slate-200 dark:border-slate-800/40 rounded-xl sm:rounded-2xl transition-colors">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300">Simulation Settings</h3>

      {/* Group 1: Portfolio Settings (Neutral Theme) */}
      <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-3 py-1 space-y-3">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-slate-500" />
          <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Portfolio Settings</h4>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Initial Investment</label>
            <InfoTooltip content={
              <div>
                <p className="font-bold mb-1 text-slate-100">Initial Investment</p>
                <p className="mb-2 text-slate-300">The starting principal value of your portfolio.</p>
                <p className="text-slate-300"><span className="text-blue-400 font-semibold">Common values:</span> $10,000 (retail/starter), $100,000 (mid-career), or $1,000,000 (typical retirement/financial independence milestone).</p>
              </div>
            } />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">$</span>
            <input
              type="text"
              value={initialInvestment.toLocaleString()}
              onChange={(e) => {
                const numeric = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                setInitialInvestment(numeric);
              }}
              className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 pl-7 pr-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Group 2: Historical Backtest Settings (Blue Theme) */}
      <div className="border-l-2 border-blue-500 dark:border-blue-400 pl-3 py-1 space-y-3 bg-blue-50/10 dark:bg-blue-950/5 p-2.5 sm:p-3 rounded-r-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <h4 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Historical Backtest</h4>
          </div>
          <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Blue Chart</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Benchmark</label>
              <InfoTooltip content={
                <div>
                  <p className="font-bold mb-1 text-slate-100">Benchmark Index</p>
                  <p className="mb-2 text-slate-300">The index or fund used to compare your customized portfolio's historical and simulated growth against.</p>
                  <p className="text-slate-300"><span className="text-blue-400 font-semibold">Common Choices:</span> SPY (S&P 500) representing US large-cap equities, VT for total global stocks, or BND for US aggregate bonds.</p>
                </div>
              } />
            </div>
            <select
              value={benchmarkTicker}
              onChange={(e) => setBenchmarkTicker(e.target.value)}
              className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
            >
              {PRESET_BENCHMARKS.map(bench => (
                <option key={bench.ticker} value={bench.ticker}>
                  {bench.ticker} - {bench.name.split(' (')[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Backtest Range</label>
              <InfoTooltip content={
                <div>
                  <p className="font-bold mb-1 text-slate-100">Backtest Historical Range</p>
                  <p className="mb-2 text-slate-300">The historical period of daily returns used to compute asset performance, correlation, and standard deviation.</p>
                  <p className="text-slate-300"><span className="text-blue-400 font-semibold">Suggested choice:</span> 5 Years (Default) to balance modern economic trends and sufficient statistical market data.</p>
                </div>
              } />
            </div>
            <select
              value={historicalRange}
              onChange={(e) => setHistoricalRange(e.target.value as HistoricalRange)}
              className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
            >
              <option value="1y">1 year</option>
              <option value="3y">3 years</option>
              <option value="5y">5 years (Default)</option>
              <option value="10y">10 years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Group 3: Monte Carlo Projections Settings (Purple Theme) */}
      <div className="border-l-2 border-purple-500 dark:border-purple-400 pl-3 py-1 space-y-3 bg-purple-50/10 dark:bg-purple-950/5 p-2.5 sm:p-3 rounded-r-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <h4 className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Future Projections</h4>
          </div>
          <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Purple Chart</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Horizon (Years)</label>
              <InfoTooltip content={
                <div>
                  <p className="font-bold mb-1 text-slate-100">Horizon (Years)</p>
                  <p className="mb-2 text-slate-300">How many years into the future you want to project your portfolio's performance.</p>
                  <p className="text-slate-300"><span className="text-purple-400 font-semibold">Suggested choice:</span> 10–20 years for mid-term targets, or 30–40 years for long-term retirement planning.</p>
                </div>
              } />
            </div>
            <input
              type="number"
              value={horizonYears}
              onChange={(e) => setHorizonYears(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
              min="1"
              max="50"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Simulation Runs</label>
              <InfoTooltip content={
                <div>
                  <p className="font-bold mb-1 text-slate-100">Simulation Runs</p>
                  <p className="mb-2 text-slate-300">The number of independent randomized future price paths simulated.</p>
                  <p className="text-slate-300"><span className="text-purple-400 font-semibold">Suggested choice:</span> 5,000 runs (best balance of calculation speed and tail-risk percentile accuracy).</p>
                </div>
              } />
            </div>
            <select
              value={simulationsCount}
              onChange={(e) => setSimulationsCount(parseInt(e.target.value))}
              className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors shadow-sm cursor-pointer"
            >
              <option value="1000">1,000 runs (Fast)</option>
              <option value="2500">2,500 runs</option>
              <option value="5000">5,000 runs (Recommended)</option>
              <option value="10000">10,000 runs (High accuracy)</option>
            </select>
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Simulation Model</label>
            <InfoTooltip content={
              <div>
                <p className="font-bold mb-1 text-slate-100">Simulation Model</p>
                <p className="mb-2 text-slate-300">Choose the mathematical engine used to project randomized future return paths.</p>
                <p className="mb-1.5 text-slate-300"><span className="text-purple-400 font-semibold">Brownian Motion (GBM):</span> Projects standard continuous log-normal paths based on historical mean and standard deviation.</p>
                <p className="text-slate-300"><span className="text-purple-400 font-semibold">Historical Resample (Bootstrap):</span> Randomly extracts daily return chunks directly from real history. Preserves natural skewness, fat-tail crash events, and correlation.</p>
              </div>
            } />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModel('gbm')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                model === 'gbm'
                  ? 'bg-purple-50 dark:bg-purple-600/10 border-purple-500 text-purple-600 dark:text-purple-400 font-bold shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <div className="text-center">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Brownian Motion</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setModel('bootstrap')}
              className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                model === 'bootstrap'
                  ? 'bg-purple-50 dark:bg-purple-600/10 border-purple-500 text-purple-600 dark:text-purple-400 font-bold shadow-[0_0_12px_rgba(168,85,247,0.1)]'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <div className="text-center">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Historical Resample</p>
              </div>
            </button>
          </div>
        </div>

        {/* Rebalance Frequency */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Rebalancing Frequency</label>
            <InfoTooltip content={
              <div>
                <p className="font-bold mb-1 text-slate-100">Rebalancing Frequency</p>
                <p className="mb-2 text-slate-300">Determines how often your portfolio asset weights are reset back to your target allocation percentage.</p>
                <p className="mb-1 text-slate-300"><span className="text-purple-400 font-semibold">None:</span> Portfolio drifts unchecked (highest asset variance).</p>
                <p className="mb-1 text-slate-300"><span className="text-purple-400 font-semibold">Monthly/Annually:</span> Resets weights on fixed calendar intervals. Annually is the standard retail/institutional default.</p>
                <p className="text-slate-300"><span className="text-purple-400 font-semibold">Threshold:</span> Dynamic rebalancing whenever an asset drifts past a deviation boundary (e.g., 5%).</p>
              </div>
            } />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            {(['none', 'monthly', 'annually', 'threshold'] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setRebalanceFrequency(freq)}
                className={`py-1.5 sm:py-1 px-1 rounded-md text-[9px] font-bold uppercase tracking-wide cursor-pointer transition-all ${
                  rebalanceFrequency === freq
                    ? 'bg-purple-500 dark:bg-purple-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Group 4: Advanced Realism & Frictions (Expandable Amber Theme) */}
      <div className="border-l-2 border-amber-500 dark:border-amber-400 pl-3 py-1 space-y-3 bg-amber-50/10 dark:bg-amber-950/5 p-2.5 sm:p-3 rounded-r-xl">
        <button
          type="button"
          onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
          className="w-full flex items-center justify-between text-left cursor-pointer group animate-none"
        >
          <div className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-45 transition-transform" />
            <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Advanced Realism & Frictions</h4>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
              {isAdvancedExpanded ? 'Hide' : 'Expand'}
            </span>
            {isAdvancedExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
        </button>

        {isAdvancedExpanded && (
          <div className="space-y-4 pt-1 border-t border-amber-500/10 dark:border-amber-500/5 mt-1">
            {/* 1. Monthly Cash Flows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Periodic Cash Flows</h5>
                <InfoTooltip content={
                  <div>
                    <p className="font-bold mb-1 text-slate-100">Periodic Cash Flows</p>
                    <p className="mb-2 text-slate-300">Simulate ongoing monthly savings or systematic retirement spending.</p>
                    <p className="mb-1.5 text-slate-300"><span className="text-amber-400 font-semibold">Monthly Deposit:</span> Suggested: $100 – $2,000/mo to model continuous savings contribution.</p>
                    <p className="text-slate-300"><span className="text-amber-400 font-semibold">Monthly Withdrawal:</span> Suggested: $0 during accumulation, or 3%–4% of your starting portfolio annually (divided by 12) for retirement income.</p>
                  </div>
                } />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Monthly Deposit ($)</label>
                  <input
                    type="text"
                    value={monthlyContribution.toLocaleString()}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                      setMonthlyContribution(val);
                    }}
                    className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Monthly Withdrawal ($)</label>
                  <input
                    type="text"
                    value={monthlyWithdrawal.toLocaleString()}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                      setMonthlyWithdrawal(val);
                    }}
                    className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* 2. Inflation adjustment */}
            <div className="space-y-2 border-t border-amber-500/10 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inflation (Real Return Drag)</h5>
                  <InfoTooltip content={
                    <div>
                      <p className="font-bold mb-1 text-slate-100">Inflation Drag</p>
                      <p className="mb-2 text-slate-300">Reduces nominal projected returns to display values in "today's dollars" (representing future purchasing power).</p>
                      <p className="text-slate-300"><span className="text-amber-400 font-semibold">Suggested rate:</span> 2.0% (historical Fed inflation target) to 3.0% (long-term US historical average). Disable to show nominal growth.</p>
                    </div>
                  } />
                </div>
                <label className="relative inline-flex h-4 w-7 items-center rounded-full cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={adjustInflation}
                    onChange={(e) => setAdjustInflation(e.target.checked)}
                  />
                  <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ease-in-out ${adjustInflation ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out ${adjustInflation ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>
              
              {adjustInflation && (
                <div>
                  <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Annual Inflation Rate (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.1"
                      value={annualInflationRate * 100}
                      onChange={(e) => setAnnualInflationRate(parseFloat(e.target.value) / 100)}
                      className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 w-10 text-right">{(annualInflationRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Transaction Costs & Taxes */}
            <div className="space-y-2 border-t border-amber-500/10 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Taxable Account Model</h5>
                  <InfoTooltip content={
                    <div>
                      <p className="font-bold mb-1 text-slate-100">Taxable Account Model</p>
                      <p className="mb-2 text-slate-300">Incorporates taxation and transaction fees that drag down growth during portfolio rebalances.</p>
                      <p className="mb-1.5 text-slate-300"><span className="text-amber-400 font-semibold">Capital Gains Tax:</span> Suggested: 15% (standard US long-term gains bracket) or 20% (higher income brackets). Use 0% for tax-sheltered accounts (IRA/401k).</p>
                      <p className="text-slate-300"><span className="text-amber-400 font-semibold">Fee & Slippage:</span> Suggested: 0.05% to 0.15% to model bid-ask spreads, transaction commission, and price slippage. 0.1% is the industry average benchmark.</p>
                    </div>
                  } />
                </div>
                <label className="relative inline-flex h-4 w-7 items-center rounded-full cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isTaxable}
                    onChange={(e) => setIsTaxable(e.target.checked)}
                  />
                  <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ease-in-out ${isTaxable ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out ${isTaxable ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {isTaxable && (
                  <div>
                    <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Capital Gains Tax (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={capitalGainsTaxRate * 100}
                      onChange={(e) => setCapitalGainsTaxRate(Math.min(50, Math.max(0, parseFloat(e.target.value) || 0)) / 100)}
                      className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
                    />
                  </div>
                )}
                <div className={isTaxable ? "" : "col-span-2"}>
                  <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Fee & Slippage per Trade (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.01"
                    value={transactionFeeRate * 100}
                    onChange={(e) => setTransactionFeeRate(Math.min(5, Math.max(0, parseFloat(e.target.value) || 0)) / 100)}
                    className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* 4. Advanced Quantitative Parameters */}
            <div className="space-y-2 border-t border-amber-500/10 pt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h5 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Advanced Math Engine</h5>
                  <InfoTooltip content={
                    <div>
                      <p className="font-bold mb-1 text-slate-100">Advanced Math Engine</p>
                      <p className="mb-2 text-slate-300">Integrates advanced institutional-grade mathematical models into the Monte Carlo paths.</p>
                      <p className="mb-1.5 text-slate-300"><span className="text-amber-400 font-semibold">GARCH(1,1) Volatility:</span> Models volatility clustering (the tendency of highly volatile market periods to group together, simulating realistic panic/calm cycles). Suggested: ON (GBM model only).</p>
                      <p className="text-slate-300"><span className="text-amber-400 font-semibold">Merton Jumps:</span> Adds randomized discontinuous "jumps" (extreme crash events, e.g., flash crashes) to the simulations. Suggested: ON (GBM model only).</p>
                    </div>
                  } />
                </div>
              </div>
              
              {model === 'gbm' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <label className="text-[9px] text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wide">GARCH(1,1) Vol</label>
                    <input
                      type="checkbox"
                      className="sr-only"
                      id="useGarch"
                      checked={useGarch}
                      onChange={(e) => setUseGarch(e.target.checked)}
                    />
                    <label htmlFor="useGarch" className="relative inline-flex h-4 w-7 items-center rounded-full cursor-pointer select-none">
                      <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ease-in-out ${useGarch ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out ${useGarch ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <label className="text-[9px] text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-wide">Merton Jumps</label>
                    <input
                      type="checkbox"
                      className="sr-only"
                      id="useMertonJumps"
                      checked={useMertonJumps}
                      onChange={(e) => setUseMertonJumps(e.target.checked)}
                    />
                    <label htmlFor="useMertonJumps" className="relative inline-flex h-4 w-7 items-center rounded-full cursor-pointer select-none">
                      <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ease-in-out ${useMertonJumps ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out ${useMertonJumps ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {model === 'bootstrap' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Bootstrap Block Size (Days)</label>
                    <InfoTooltip content={
                      <div>
                        <p className="font-bold mb-1 text-slate-100">Bootstrap Block Size</p>
                        <p className="mb-2 text-slate-300">The length of consecutive daily historical returns sampled in "blocks" to preserve short-term price trend/momentum effects.</p>
                        <p className="text-slate-300"><span className="text-amber-400 font-semibold">Suggested choice:</span> 5 to 21 days (5d = 1 trading week, 10d = 2 weeks, 21d = 1 month). Default is 10 days.</p>
                      </div>
                    } />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="2"
                      max="60"
                      step="1"
                      value={bootstrapBlockSize}
                      onChange={(e) => setBootstrapBlockSize(parseInt(e.target.value))}
                      className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 w-8 text-right">{bootstrapBlockSize}d</span>
                  </div>
                </div>
              )}

              {rebalanceFrequency === 'threshold' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">Rebalance Trigger Threshold (%)</label>
                    <InfoTooltip content={
                      <div>
                        <p className="font-bold mb-1 text-slate-100">Rebalance Threshold</p>
                        <p className="mb-2 text-slate-300">The maximum allocation drift allowed before a dynamic portfolio rebalancing trade is triggered.</p>
                        <p className="text-slate-300"><span className="text-amber-400 font-semibold">Suggested choice:</span> 5.0% (industry-standard default that limits drift without triggering excessive tax or trading fees) or 10.0%.</p>
                      </div>
                    } />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={rebalanceThreshold}
                      onChange={(e) => setRebalanceThreshold(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 w-10 text-right">{rebalanceThreshold.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Big Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-100 dark:bg-slate-900/40 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer transition-all shrink-0 order-2 sm:order-1"
          title="Reset back to default preset"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        <button
          type="button"
          onClick={onRunSimulation}
          disabled={!isValid || loading}
          className={`w-full sm:flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-lg transition-all order-1 sm:order-2 ${
            loading
              ? 'bg-blue-600/50 text-slate-300 cursor-wait'
              : !isValid
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-900'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-100 hover:shadow-blue-500/20 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Run Simulation Engine
            </>
          )}
        </button>
      </div>

      {!isValid && (
        <p className="text-[10px] text-amber-500 font-medium flex items-start gap-1 p-2 bg-amber-500/5 border border-amber-500/10 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>Please ensure you have added at least one asset and that your allocation weights sum to exactly 100% to run.</span>
        </p>
      )}

      <div className="text-center pt-3 border-t border-slate-200 dark:border-slate-800/40 flex items-center justify-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-medium transition-colors">
        <span>Market data powered by</span>
        <a
          href="https://finance.yahoo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors font-semibold"
        >
          Yahoo Finance
        </a>
      </div>
    </div>
  );
}
