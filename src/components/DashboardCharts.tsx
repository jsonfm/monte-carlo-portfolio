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
      className={`flex flex-col space-y-4 ${isFullscreen ? 'bg-slate-50 dark:bg-[#0b0f19] p-6 overflow-y-auto' : ''}`}
    >
      {/* Chart Controls */}
      <div className="flex justify-end gap-2">
        <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex items-center">
          <button
            onClick={() => setChartsLayout('horizontal')}
            className={`p-1.5 rounded-md transition-colors ${chartsLayout === 'horizontal' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            title="Horizontal Layout"
          >
            <Columns className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartsLayout('vertical')}
            className={`p-1.5 rounded-md transition-colors ${chartsLayout === 'vertical' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
            title="Vertical Layout"
          >
            <Rows className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={toggleFullscreen}
          className="bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 p-2 rounded-lg transition-colors flex items-center justify-center"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
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
