import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { HistoricalMetrics } from '@/types';
import InfoTooltip from '@/components/InfoTooltip';

interface HistoricalChartProps {
  historicalData: HistoricalMetrics | null;
  benchmarkTicker: string;
}

export default function HistoricalChart({ historicalData, benchmarkTicker }: HistoricalChartProps) {
  if (!historicalData) {
    return (
      <div className="flex flex-col items-center justify-center h-80 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-100/50 dark:bg-slate-950/20 transition-colors">
        <span className="w-5 h-5 border-2 border-slate-400 dark:border-slate-700 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-600 dark:text-slate-500 font-semibold uppercase tracking-wider">Awaiting Historical Backtest Data</p>
      </div>
    );
  }

  const { dates, portfolioPrices, benchmarkPrices } = historicalData;

  // Thin out the data so Recharts doesn't choke on thousands of daily points.
  // We can sample roughly 300-500 points (e.g. weekly or spaced index) which is perfect for rendering.
  const totalDays = dates.length;
  const sampleInterval = Math.max(1, Math.floor(totalDays / 300));
  
  const chartData = [];
  for (let i = 0; i < totalDays; i += sampleInterval) {
    chartData.push({
      date: dates[i],
      Portfolio: Math.round(portfolioPrices[i]),
      Benchmark: Math.round(benchmarkPrices[i]),
    });
  }

  // Ensure last point is always included
  if (totalDays > 0 && (totalDays - 1) % sampleInterval !== 0) {
    chartData.push({
      date: dates[totalDays - 1],
      Portfolio: Math.round(portfolioPrices[totalDays - 1]),
      Benchmark: Math.round(benchmarkPrices[totalDays - 1]),
    });
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 space-y-4 shadow-sm transition-colors">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full shrink-0" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Historical Growth Backtest</h3>
            <InfoTooltip content="This visualizes how your customized portfolio would have performed in the past vs your selected benchmark, assuming you invested $10,000 at the beginning of the available historical period." />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Growth of an initial $10,000 investment over the historical period</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" /> Portfolio
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" /> {benchmarkTicker}
          </span>
        </div>
      </div>

      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="var(--chart-text)" 
              fontSize={10} 
              fontWeight="bold"
              tickFormatter={formatDate}
              minTickGap={40}
            />
            <YAxis 
              stroke="var(--chart-text)" 
              fontSize={10} 
              fontWeight="bold"
              tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                border: '1px solid var(--chart-tooltip-border)',
                borderRadius: '12px',
                color: 'var(--chart-tooltip-text)',
                fontSize: '12px',
              }}
              labelFormatter={(label) => formatDate(label as string)}
              formatter={(value) => [formatCurrency(Number(value))]}
            />
            <Line 
              type="monotone" 
              dataKey="Portfolio" 
              stroke="#3b82f6" 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="Benchmark" 
              name={benchmarkTicker}
              stroke="#64748b" 
              strokeWidth={2.5} 
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
