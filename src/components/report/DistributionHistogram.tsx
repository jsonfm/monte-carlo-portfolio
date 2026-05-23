import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { formatCurrency } from '@/utils/reportInsights';

interface DistributionHistogramProps {
  finalValues: number[];
  initialValue: number;
  medianFinalValue: number;
}

export function DistributionHistogram({
  finalValues,
  initialValue,
  medianFinalValue,
}: DistributionHistogramProps) {
  const chartData = useMemo(() => {
    if (finalValues.length === 0) return [];

    // Caps the histogram at the 95th percentile to prevent long-tail compression of the chart
    const minVal = finalValues[0];
    const p95Index = Math.floor(finalValues.length * 0.95);
    const maxVal = finalValues[p95Index] || finalValues[finalValues.length - 1];
    
    const numBins = 24;
    const binWidth = (maxVal - minVal) / numBins;
    
    const bins = Array(numBins).fill(0).map((_, i) => ({
      index: i,
      min: minVal + i * binWidth,
      max: minVal + (i + 1) * binWidth,
      count: 0,
      label: `${formatCurrency(minVal + i * binWidth)} - ${formatCurrency(minVal + (i + 1) * binWidth)}`,
    }));

    // Populate bins
    finalValues.forEach(val => {
      // Find the appropriate bin
      if (val >= minVal && val <= maxVal) {
        const binIndex = Math.min(
          Math.floor((val - minVal) / binWidth),
          numBins - 1
        );
        bins[binIndex].count += 1;
      }
    });

    // Translate counts to percentages of overall simulation trial pool
    return bins.map(b => ({
      name: formatCurrency((b.min + b.max) / 2),
      range: b.label,
      percentage: (b.count / finalValues.length) * 100,
      count: b.count,
    }));
  }, [finalValues]);

  return (
    <div className="space-y-2">
      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">Distribution of Simulated Outlier Wealth (Capped at 95%)</span>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">
        This bell-curve represents where your trials landed. The area to the left of the initial investment represents loss, and to the right represents compounding gains.
      </p>

      <div className="h-44 sm:h-52 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/40" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 8 }} 
              stroke="#94a3b8" 
              axisLine={false}
              tickLine={false}
              dy={5}
            />
            <YAxis 
              tick={{ fontSize: 8 }} 
              stroke="#94a3b8" 
              axisLine={false}
              tickLine={false}
              dx={-5}
              unit="%"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-md text-[10px] leading-tight max-w-[200px]">
                      <p className="font-bold text-slate-700 dark:text-slate-200">{data.range}</p>
                      <p className="text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">
                        Trials: {data.count.toLocaleString()} ({data.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="percentage" 
              fill="#818cf8" 
              radius={[4, 4, 0, 0]}
              className="fill-indigo-500/70 dark:fill-indigo-400/50 hover:fill-indigo-500 transition-colors"
            />
            
            {/* Reference Line for Initial Investment */}
            <ReferenceLine 
              x={formatCurrency(initialValue)} // find closest matched label or draw directly
              stroke="#f43f5e" 
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={{ 
                value: 'Initial', 
                position: 'top', 
                fill: '#f43f5e', 
                fontSize: 8, 
                fontWeight: 'bold' 
              }} 
            />

            {/* Reference Line for Median Ending */}
            <ReferenceLine 
              x={formatCurrency(medianFinalValue)} 
              stroke="#8b5cf6" 
              strokeWidth={1.5}
              label={{ 
                value: 'Median', 
                position: 'top', 
                fill: '#8b5cf6', 
                fontSize: 8, 
                fontWeight: 'bold' 
              }} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
