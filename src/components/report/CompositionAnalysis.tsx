import { useMemo } from 'react';
import { ShieldCheck, AlertTriangle, Layers } from 'lucide-react';
import type { Asset } from '@/types';
import { getConcentrationDetails } from '@/utils/reportInsights';

interface CompositionAnalysisProps {
  assets: Asset[];
}

export function CompositionAnalysis({ assets }: CompositionAnalysisProps) {
  const { hhi, rating, classification, description } = useMemo(() => {
    return getConcentrationDetails(assets);
  }, [assets]);

  // 1. Group by Asset Type
  const assetTypes = useMemo(() => {
    const sums: Record<string, number> = { stock: 0, etf: 0, bond: 0, crypto: 0 };
    assets.forEach(a => {
      if (sums[a.type] !== undefined) {
        sums[a.type] += a.weight;
      } else {
        sums[a.type] = a.weight;
      }
    });
    return sums;
  }, [assets]);

  // 2. Sort assets by weight to get top holdings
  const sortedAssets = useMemo(() => {
    return [...assets].sort((a, b) => b.weight - a.weight);
  }, [assets]);

  const top3Weight = useMemo(() => {
    return sortedAssets.slice(0, 3).reduce((sum, a) => sum + a.weight, 0);
  }, [sortedAssets]);

  const ratingColors: Record<string, string> = {
    A: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    B: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    C: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    D: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    F: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  const assetLabels: Record<string, string> = {
    stock: 'Individual Equities',
    etf: 'Exchange-Traded Funds (ETFs)',
    bond: 'Fixed Income / Bonds',
    crypto: 'Cryptocurrencies',
  };

  const assetBarColors: Record<string, string> = {
    stock: 'bg-blue-500',
    etf: 'bg-indigo-500',
    bond: 'bg-emerald-500',
    crypto: 'bg-purple-500',
  };

  const maxHolding = sortedAssets[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1 border-b-2 border-slate-900/5 dark:border-slate-100/5 pb-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Layers className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-[0.15em]">
            Portfolio Composition & Diversification Audit
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Concentration Grade Card (4/12 cols) */}
        <div className="md:col-span-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 flex flex-col items-center justify-between text-center space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Concentration Score</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Herfindahl-Hirschman Index</span>
          </div>

          <div className={`w-20 h-20 rounded-full border flex flex-col items-center justify-center ${ratingColors[rating]}`}>
            <span className="text-3xl font-black tracking-tight leading-none">{rating}</span>
            <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">Grade</span>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {classification}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal px-2">
              HHI of {hhi.toFixed(0)} ({assets.length} holdings). {description}
            </p>
          </div>
        </div>

        {/* Structure Breakdown Card (8/12 cols) */}
        <div className="md:col-span-8 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 space-y-5">
          {/* Stacked Asset Class Bar */}
          <div className="space-y-2">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Asset Class Allocation</span>
            <div className="h-4 bg-slate-150 dark:bg-slate-900 rounded-full overflow-hidden flex border border-slate-200/40 dark:border-slate-800/30 shadow-inner">
              {Object.entries(assetTypes).map(([type, weight]) => {
                if (weight === 0) return null;
                return (
                  <div
                    key={type}
                    className={`h-full ${assetBarColors[type]} transition-all duration-500`}
                    style={{ width: `${weight}%` }}
                    title={`${assetLabels[type]}: ${weight}%`}
                  />
                );
              })}
            </div>
            
            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {Object.entries(assetTypes).map(([type, weight]) => {
                if (weight === 0) return null;
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${assetBarColors[type]}`} />
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
                      {assetLabels[type].split(' (')[0]}: <strong className="font-bold text-slate-700 dark:text-slate-200">{weight}%</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Holdings Analytics */}
          <div className="border-t border-slate-200 dark:border-slate-800/40 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Key Holding Analysis</span>
              <div className="flex items-center gap-2">
                {maxHolding && maxHolding.weight > 40 ? (
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-normal">
                  {maxHolding ? (
                    maxHolding.weight > 40 ? (
                      <>Your top holding is <strong className="font-bold text-slate-800 dark:text-slate-200">{maxHolding.ticker} ({maxHolding.weight}%)</strong>. This creates elevated concentration risk.</>
                    ) : (
                      <>Your largest asset is <strong className="font-bold text-slate-800 dark:text-slate-200">{maxHolding.ticker} ({maxHolding.weight}%)</strong>, which falls within healthy risk bounds.</>
                    )
                  ) : 'No assets configured.'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Concentration Thresholds</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                Your top 3 holdings command <strong className="font-black text-slate-850 dark:text-slate-200">{top3Weight}%</strong> of overall capital. Concentrating more than 75% in the top 3 holdings increases exposure to idiosyncratic shocks.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
