import { Play, RotateCcw, AlertTriangle, Coins, TrendingUp, Sparkles } from 'lucide-react';
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
  rebalanceFrequency: 'none' | 'monthly' | 'annually';
  setRebalanceFrequency: (v: 'none' | 'monthly' | 'annually') => void;
  benchmarkTicker: string;
  setBenchmarkTicker: (v: string) => void;
  historicalRange: HistoricalRange;
  setHistoricalRange: (v: HistoricalRange) => void;
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
  onRunSimulation,
  onReset,
  isValid,
  loading,
}: SimulationControlsProps) {
  return (
    <div className="space-y-5 bg-slate-50 dark:bg-slate-900/10 p-5 border border-slate-200 dark:border-slate-800/40 rounded-2xl transition-colors">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300">Simulation Settings</h3>

      {/* Group 1: Portfolio Settings (Neutral Theme) */}
      <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-3 py-1 space-y-3">
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-slate-500" />
          <h4 className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Portfolio Settings</h4>
        </div>
        <div>
          <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Initial Investment</label>
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
      <div className="border-l-2 border-blue-500 dark:border-blue-400 pl-3 py-1 space-y-3 bg-blue-50/10 dark:bg-blue-950/5 p-3 rounded-r-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <h4 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Historical Backtest</h4>
          </div>
          <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Blue Chart</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Benchmark</label>
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
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Backtest Range</label>
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
      <div className="border-l-2 border-purple-500 dark:border-purple-400 pl-3 py-1 space-y-3 bg-purple-50/10 dark:bg-purple-950/5 p-3 rounded-r-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <h4 className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Future Projections</h4>
          </div>
          <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Purple Chart</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Horizon (Years)</label>
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
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Simulation Runs</label>
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
            <InfoTooltip content="Choose how future paths are generated: either statistically assuming normal distribution (GBM), or by randomly drawing actual historical market days to preserve true market behavior (Bootstrapping)." />
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
            <InfoTooltip content="Determines how often the asset weights are reset back to your original target allocation. This prevents faster-growing assets from over-concentrating your portfolio and controls risk over time." />
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            {(['none', 'monthly', 'annually'] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setRebalanceFrequency(freq)}
                className={`py-1 px-2 rounded-md text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all ${
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

      {/* Big Action Buttons */}
      <div className="flex gap-2.5 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-100 dark:bg-slate-900/40 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold py-2.5 px-4 rounded-xl cursor-pointer transition-all shrink-0"
          title="Reset back to default preset"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        <button
          type="button"
          onClick={onRunSimulation}
          disabled={!isValid || loading}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer shadow-lg transition-all ${
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
    </div>
  );
}
