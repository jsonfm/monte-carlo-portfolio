import { useMemo } from 'react';
import { Scale, TrendingUp, Zap, HelpCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { HistoricalMetrics } from '@/types';
import { formatPercent } from '@/utils/reportInsights';
import InfoTooltip from '@/components/InfoTooltip';

interface BenchmarkComparisonProps {
  historicalData: HistoricalMetrics | null;
  benchmarkTicker: string;
}

export function BenchmarkComparison({
  historicalData,
  benchmarkTicker,
}: BenchmarkComparisonProps) {
  if (!historicalData) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-6 text-center space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syncing Benchmark Relations...</p>
        <p className="text-[10px] text-slate-400">Please wait for historical market pricing to finish loading.</p>
      </div>
    );
  }

  const hPort = historicalData.metrics.portfolio;
  const hBench = historicalData.metrics.benchmark;
  const { alpha, beta, correlation } = historicalData.metrics;

  const verdict = useMemo(() => {
    const alphaPct = alpha * 100;
    const isOutperforming = alphaPct > 0;
    const alphaFormatted = `${isOutperforming ? '+' : ''}${alphaPct.toFixed(2)}%`;

    let description = '';
    if (isOutperforming) {
      if (beta < 0.9) {
        description = `Defensive outperformance. The portfolio historically generated a ${alphaFormatted} annualized alpha relative to the benchmark while maintaining a lower-beta sensitivity (${beta.toFixed(2)}), indicating strong structural efficiency.`;
      } else if (beta > 1.1) {
        description = `Volatility-driven outperformance. The portfolio outperformed the benchmark with a ${alphaFormatted} annualized alpha, accompanied by ${((beta - 1) * 100).toFixed(0)}% higher historical volatility.`;
      } else {
        description = `Alpha generation. The portfolio outperformed the benchmark by a historical ${alphaFormatted} annualized with similar systematic market risk (${beta.toFixed(2)} beta).`;
      }
    } else {
      if (beta < 0.8) {
        description = `Defensive asset cushioning. Although annualized alpha was ${alphaFormatted}, the lower systematic risk (${beta.toFixed(2)} beta) helped cushion peak drawdowns relative to the broader market index.`;
      } else {
        description = `Relative underperformance. Underperforming the benchmark (annualized alpha of ${alphaFormatted}) without a corresponding reduction in systemic risk suggests there may be potential to adjust the asset mix.`;
      }
    }

    return { alphaFormatted, isOutperforming, description };
  }, [alpha, beta]);

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b-2 border-slate-900/5 dark:border-slate-100/5 pb-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Scale className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-[0.15em]">
            Benchmark Co-Movement & Efficiency Analysis
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left: Metric Table (7/12 cols) */}
        <div className="md:col-span-7 space-y-3">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Historical Relative Scorecard</span>
          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">Performance Metric</th>
                  <th className="py-2.5 px-3 text-right">Your Portfolio</th>
                  <th className="py-2.5 px-4 text-right">{benchmarkTicker} (Benchmark)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/40 font-medium">
                {/* CAGR */}
                <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4 font-extrabold text-slate-700 dark:text-slate-300">Annual Return (CAGR)</td>
                  <td className="py-3 px-3 text-right font-black text-indigo-600 dark:text-indigo-400">{formatPercent(hPort.cagr)}</td>
                  <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{formatPercent(hBench.cagr)}</td>
                </tr>
                {/* Volatility */}
                <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4 font-extrabold text-slate-700 dark:text-slate-300">Annual Volatility (Risk)</td>
                  <td className="py-3 px-3 text-right font-black text-slate-800 dark:text-slate-200">{formatPercent(hPort.volatility)}</td>
                  <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{formatPercent(hBench.volatility)}</td>
                </tr>
                {/* Sharpe */}
                <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4 font-extrabold text-slate-700 dark:text-slate-300">Sharpe Ratio</td>
                  <td className="py-3 px-3 text-right font-black text-slate-800 dark:text-slate-200">{hPort.sharpeRatio.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{hBench.sharpeRatio.toFixed(2)}</td>
                </tr>
                {/* Sortino */}
                <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4 font-extrabold text-slate-700 dark:text-slate-300">Sortino Ratio (Downside Risk)</td>
                  <td className="py-3 px-3 text-right font-black text-slate-800 dark:text-slate-200">{hPort.sortinoRatio.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400">{hBench.sortinoRatio.toFixed(2)}</td>
                </tr>
                {/* Max Drawdown */}
                <tr className="hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4 font-extrabold text-slate-700 dark:text-slate-300">Max Historical Drawdown</td>
                  <td className="py-3 px-3 text-right font-black text-rose-500">-{formatPercent(hPort.maxDrawdown)}</td>
                  <td className="py-3 px-4 text-right text-rose-500/80">-{formatPercent(hBench.maxDrawdown)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: CAPM Grid & Commentary (5/12 cols) */}
        <div className="md:col-span-5 space-y-4">
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Modern Portfolio CAPM Relations</span>
          
          <div className="grid grid-cols-3 gap-3">
            {/* Jensen's Alpha */}
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-250 dark:border-slate-800/40 p-3 rounded-xl text-center space-y-0.5">
              <span className="text-[8px] text-slate-400 uppercase font-semibold block">Jensen's Alpha</span>
              <p className={`text-xs font-black ${verdict.isOutperforming ? 'text-emerald-500' : 'text-rose-500'}`}>
                {verdict.alphaFormatted}
              </p>
            </div>
            {/* Portfolio Beta */}
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-250 dark:border-slate-800/40 p-3 rounded-xl text-center space-y-0.5">
              <span className="text-[8px] text-slate-400 uppercase font-semibold block">Beta Sensitivity</span>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                {beta.toFixed(2)}
              </p>
            </div>
            {/* R-squared */}
            <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-250 dark:border-slate-800/40 p-3 rounded-xl text-center space-y-0.5">
              <span className="text-[8px] text-slate-400 uppercase font-semibold block">R-Sq Linkage</span>
              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                {formatPercent(correlation)}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/40 p-4.5 rounded-2xl flex items-start gap-3">
            <div className={`p-1.5 rounded-lg shrink-0 ${verdict.isOutperforming ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {verdict.isOutperforming ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-semibold block">Risk Efficiency Profile</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {verdict.description}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
