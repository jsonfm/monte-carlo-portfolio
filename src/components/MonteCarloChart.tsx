import { useState } from 'react';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Eye, EyeOff, Info } from 'lucide-react';
import type { SimulationSummary } from '@/types';
import InfoTooltip from '@/components/InfoTooltip';

interface MonteCarloChartProps {
  simulationData: SimulationSummary | null;
  loading: boolean;
}

export default function MonteCarloChart({ simulationData, loading }: MonteCarloChartProps) {
  const [showSamplePaths, setShowSamplePaths] = useState(false);

  if (loading && !simulationData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-100/50 dark:bg-slate-950/20 transition-colors">
        <span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider animate-pulse">Running Monte Carlo Simulations...</p>
      </div>
    );
  }

  if (!simulationData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-100/50 dark:bg-slate-950/20 transition-colors">
        <Info className="w-5 h-5 text-slate-400 dark:text-slate-600 mb-2" />
        <p className="text-xs text-slate-600 dark:text-slate-500 font-semibold uppercase tracking-wider">Awaiting Simulation Launch</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-600 max-w-[250px] text-center mt-1">Configure your assets and click "Run Simulation Engine" to project your future performance.</p>
      </div>
    );
  }

  const { percentiles, samplePaths } = simulationData;
  const horizonYears = percentiles.p50.length - 1;

  // Build combined chart data
  const chartData = [];
  for (let year = 0; year <= horizonYears; year++) {
    const row: Record<string, number | string> = {
      year: `Yr ${year}`,
      p10: Math.round(percentiles.p10[year].value),
      p25: Math.round(percentiles.p25[year].value),
      p50: Math.round(percentiles.p50[year].value),
      p75: Math.round(percentiles.p75[year].value),
      p90: Math.round(percentiles.p90[year].value),
    };

    // Add sample paths
    if (showSamplePaths) {
      samplePaths.forEach((path, i) => {
        if (path && path[year] !== undefined) {
          row[`path_${i}`] = Math.round(path[year]);
        }
      });
    }

    chartData.push(row);
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 shadow-sm transition-colors relative">
      {loading && (
        <div className="absolute inset-0 bg-slate-50/40 dark:bg-[#0b0f19]/40 backdrop-blur-[1px] z-10 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 animate-in fade-in duration-200">
          <span className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0 mb-1" />
          <p className="text-xs text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider animate-pulse">Running Simulations...</p>
        </div>
      )}

      <div className={`space-y-4 transition-all duration-200 ${loading ? 'pointer-events-none select-none filter blur-[0.5px] opacity-75' : ''}`}>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="w-1.5 h-4 bg-purple-500 rounded-full shrink-0" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Future Growth Projections (Cone of Possibilities)</h3>
              <InfoTooltip content={
                <span>The purple shaded area represents the <strong>range of outcomes</strong>. There is a 50% probability that your portfolio ends within the <strong>inner band (25%-75%)</strong>, and an 80% probability that it ends within the <strong>outer band (10%-90%)</strong>.</span>
              } />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Monte Carlo outcomes over {horizonYears} years based on {simulationData.finalValues.length.toLocaleString()} simulated paths</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Legend Items */}
            <div className="flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-500 whitespace-nowrap">
                <span className="w-2 h-2 rounded bg-purple-500/50 shrink-0" /> 25% - 75%
              </span>
              <span className="flex items-center gap-1.5 text-purple-500/60 dark:text-purple-400/40 whitespace-nowrap">
                <span className="w-2 h-2 rounded bg-purple-400/20 dark:bg-purple-400/10 shrink-0" /> 10% - 90%
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                <span className="w-3.5 h-0.5 bg-purple-500 border-t-2 border-purple-500 shrink-0" /> Median (50th)
              </span>
            </div>

            {/* Toggle Button for Raw Paths */}
            <button
              type="button"
              onClick={() => setShowSamplePaths(!showSamplePaths)}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border cursor-pointer transition-all shrink-0 whitespace-nowrap ${
                showSamplePaths
                  ? 'bg-purple-50 dark:bg-purple-600/10 border-purple-500/60 text-purple-600 dark:text-purple-400'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-400'
              }`}
            >
              {showSamplePaths ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showSamplePaths ? 'Hide Paths' : 'Show Sample Paths'}
            </button>
          </div>
        </div>

        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
              <XAxis 
                dataKey="year" 
                stroke="var(--chart-text)" 
                fontSize={10} 
                fontWeight="bold"
              />
              <YAxis 
                stroke="var(--chart-text)" 
                fontSize={10} 
                fontWeight="bold"
                tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
              />
              
              {/* 10% - 90% outer percentile area */}
              <Area 
                type="monotone" 
                dataKey={['p10', 'p90'] as unknown as string} 
                stroke="none" 
                fill="#a855f7" 
                fillOpacity={0.06} 
              />

              {/* 25% - 75% inner percentile area */}
              <Area
                type="monotone"
                dataKey={['p25', 'p75'] as unknown as string}
                stroke="none"
                fill="#a855f7"
                fillOpacity={0.16}
              />

              {/* Render sample paths as thin grey paths */}
              {showSamplePaths && samplePaths.map((_, i) => (
                <Line
                  key={`path-${i}`}
                  type="monotone"
                  dataKey={`path_${i}`}
                  stroke="var(--chart-text)"
                  strokeWidth={1}
                  strokeOpacity={0.18}
                  dot={false}
                />
              ))}

              {/* 50th percentile (Median) Line */}
              <Line 
                type="monotone" 
                dataKey="p50" 
                stroke="#9333ea" 
                strokeWidth={3} 
                dot={{ r: 3, strokeWidth: 0, fill: '#9333ea' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--chart-tooltip-bg)',
                  border: '1px solid var(--chart-tooltip-border)',
                  borderRadius: '12px',
                  color: 'var(--chart-tooltip-text)',
                  fontSize: '11px',
                }}
                formatter={(value, name) => {
                  const nameStr = String(name);
                  if (nameStr.startsWith('path_')) return [formatCurrency(Number(value)), 'Sample Walk'];
                  if (nameStr === 'p50') return [formatCurrency(Number(value)), 'Median Projection (50th)'];
                  if (nameStr === 'p90') return [formatCurrency(Number(value)), 'Optimistic (90th)'];
                  if (nameStr === 'p75') return [formatCurrency(Number(value)), 'Moderate High (75th)'];
                  if (nameStr === 'p25') return [formatCurrency(Number(value)), 'Moderate Low (25th)'];
                  if (nameStr === 'p10') return [formatCurrency(Number(value)), 'Pessimistic (10th)'];
                  return [formatCurrency(Number(value)), nameStr];
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
