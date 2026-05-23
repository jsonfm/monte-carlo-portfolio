import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/utils/reportInsights';
import InfoTooltip from '@/components/InfoTooltip';

interface MethodologySettingsProps {
  model: 'gbm' | 'bootstrap';
  horizonYears: number;
  simulationsCount: number;
  monthlyContribution: number;
  monthlyWithdrawal: number;
  adjustInflation: boolean;
  annualInflationRate: number;
  isTaxable: boolean;
  capitalGainsTaxRate: number;
  transactionFeeRate: number;
  rebalanceFrequency: 'none' | 'monthly' | 'annually' | 'threshold';
  rebalanceThreshold: number;
  bootstrapBlockSize: number;
  useGarch: boolean;
  useMertonJumps: boolean;
}

export function MethodologySettings({
  model,
  horizonYears,
  simulationsCount,
  monthlyContribution,
  monthlyWithdrawal,
  adjustInflation,
  annualInflationRate,
  isTaxable,
  capitalGainsTaxRate,
  transactionFeeRate,
  rebalanceFrequency,
  rebalanceThreshold,
  bootstrapBlockSize,
  useGarch,
  useMertonJumps,
}: MethodologySettingsProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4.5 space-y-3">
      {/* Accordion Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" /> Simulation Settings & Assumed Constraints
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-[11px] leading-tight pt-2 border-t border-slate-200/60 dark:border-slate-800/20">
          
          {/* Model & Horizon */}
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
              Model & Horizon
              <InfoTooltip content="Determines how random walks are simulated: continuous brownian formulas or historical chunk-based resampling." />
            </span>
            <p className="font-extrabold text-slate-700 dark:text-slate-300">
              {model === 'gbm' ? 'Brownian Motion (GBM)' : 'Historical Resample'}
            </p>
            <p className="text-[10px] text-slate-500">
              {simulationsCount.toLocaleString()} trials · {horizonYears} yr horizon
            </p>
          </div>

          {/* Regular Cash Flows */}
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
              Regular Cash Flows
              <InfoTooltip content="Monthly deposits (compounds growth) or systematic withdrawals (increases capital-depletion/sequence risk)." />
            </span>
            <p className="font-extrabold text-slate-700 dark:text-slate-300">
              {monthlyContribution > 0 ? `+${formatCurrency(monthlyContribution)}/mo` : 'No Deposits'}
            </p>
            <p className="text-[10px] text-slate-500">
              {monthlyWithdrawal > 0 ? `-${formatCurrency(monthlyWithdrawal)}/mo` : 'No Withdrawals'}
            </p>
          </div>

          {/* Inflation Modeling */}
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
              Inflation Modeling
              <InfoTooltip content="Discounting nominal projections by an annual inflation rate to reflect constant-dollar purchasing power." />
            </span>
            <p className="font-extrabold text-slate-700 dark:text-slate-300">
              {adjustInflation ? `Real Drag (${(annualInflationRate * 100).toFixed(1)}%)` : 'Nominal Baseline'}
            </p>
            <p className="text-[10px] text-slate-500">
              {adjustInflation ? 'Displays real purchasing power' : 'Ignores purchase power loss'}
            </p>
          </div>

          {/* Account Taxes & Fees */}
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
              Account Taxes & Fees
              <InfoTooltip content="Capital gains taxes applied on rebalancing/liquidating events, plus friction/spread trading commissions." />
            </span>
            <p className="font-extrabold text-slate-700 dark:text-slate-300">
              {isTaxable ? `Taxable (${(capitalGainsTaxRate * 100).toFixed(0)}% rate)` : 'Tax-Advantaged'}
            </p>
            <p className="text-[10px] text-slate-500">
              Fee: {(transactionFeeRate * 100).toFixed(2)}% per trade
            </p>
          </div>

          {/* Advanced Mechanics */}
          <div className="space-y-0.5 col-span-2 md:col-span-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold flex items-center gap-1">
              Advanced Mechanics
              <InfoTooltip content="Toggles for volatility clustering (GARCH), market crashes (Merton Jumps), or block bootstrap sizes." />
            </span>
            <p className="font-extrabold text-slate-700 dark:text-slate-300 capitalize">
              {rebalanceFrequency === 'threshold' 
                ? `Threshold (±${rebalanceThreshold.toFixed(1)}%)` 
                : rebalanceFrequency === 'none' 
                ? 'No Rebalancing' 
                : `Calendar (${rebalanceFrequency})`}
            </p>
            <p className="text-[10px] text-slate-500">
              {model === 'gbm' 
                ? `${useGarch ? 'GARCH Vol' : 'Static Vol'} · ${useMertonJumps ? 'Jumps' : 'No Jumps'}`
                : `Block Size: ${bootstrapBlockSize} days`}
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
