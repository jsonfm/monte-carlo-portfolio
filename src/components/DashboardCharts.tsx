import { useState, useRef, useEffect } from 'react';
import { Columns, Rows, Maximize, Minimize } from 'lucide-react';
import HistoricalChart from './HistoricalChart';
import MonteCarloChart from './MonteCarloChart';
import type { HistoricalMetrics, SimulationSummary } from '@/types';

interface DashboardChartsProps {
  historicalMetrics: HistoricalMetrics;
  simResult: SimulationSummary | null;
  simLoading: boolean;
  benchmarkTicker: string;
}

export function DashboardCharts({
  historicalMetrics,
  simResult,
  simLoading,
  benchmarkTicker,
}: DashboardChartsProps) {
  const [chartsLayout, setChartsLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartsContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div 
      ref={chartsContainerRef} 
      className={`flex flex-col space-y-6 transition-colors duration-250 ${
        isFullscreen 
          ? 'bg-slate-50 dark:bg-[#0b0f19] p-6 overflow-y-auto w-full h-full' 
          : 'bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800/80 p-5 rounded-3xl shadow-sm dark:shadow-xl'
      }`}
    >
      {/* Container Header with Title and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/40">
        <div>
          <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-none uppercase">
            Performance & Growth Analytics
          </h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Historical backtest performance compared to benchmark and future simulated outcomes.
          </p>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg flex items-center border border-slate-200/60 dark:border-slate-800/80">
            <button
              onClick={() => setChartsLayout('horizontal')}
              className={`p-1.5 rounded-md transition-all ${
                chartsLayout === 'horizontal' 
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
              title="Side-by-Side Layout"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartsLayout('vertical')}
              className={`p-1.5 rounded-md transition-all ${
                chartsLayout === 'vertical' 
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
              title="Stacked Layout"
            >
              <Rows className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={toggleFullscreen}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 p-2 rounded-lg transition-colors flex items-center justify-center border border-slate-200/60 dark:border-slate-800/80"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Chart Grid */}
      <div className={`grid gap-6 ${chartsLayout === 'horizontal' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Historical Growth Backtest Chart */}
        <HistoricalChart 
          historicalData={historicalMetrics} 
          benchmarkTicker={benchmarkTicker}
        />

        {/* Monte Carlo Simulated Projection Chart */}
        <MonteCarloChart simulationData={simResult} loading={simLoading} />
      </div>
    </div>
  );
}
