import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Asset } from '@/types';
import { getAssetColor } from '@/utils/colors';

interface AllocationPieChartProps {
  assets: Asset[];
}

interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  fill: string;
  payload: {
    ticker: string;
    name: string;
    value: number;
  };
  percent: number;
  value: number;
}

const renderCustomizedLabel = (props: unknown) => {
  const labelProps = props as CustomizedLabelProps;
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, outerRadius, fill, payload, percent, value } = labelProps;
  
  // Don't show label for very small slices to avoid overlap
  if (percent < 0.04) return null;

  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + outerRadius * cos;
  const sy = cy + outerRadius * sin;
  const mx = cx + (outerRadius + 12) * cos;
  const my = cy + (outerRadius + 12) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5} opacity={0.5} />
      <circle cx={ex} cy={ey} r={2.5} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} dy={3} textAnchor={textAnchor} className="fill-slate-600 dark:fill-slate-400 text-[11px] font-bold">
        {payload.ticker} ({value}%)
      </text>
    </g>
  );
};

export function AllocationPieChart({ assets }: AllocationPieChartProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const chartData = React.useMemo(() => {
    return assets
      .filter(a => a.weight > 0)
      .map(a => ({
        name: a.name || a.ticker,
        ticker: a.ticker,
        value: a.weight,
      }));
  }, [assets]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-100/50 dark:bg-slate-950/50 transition-colors">
        <p className="text-sm text-slate-500 dark:text-slate-400">Configure assets to see allocation</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-center w-full h-full gap-4 md:gap-8">
      <div className="w-full md:w-1/2 h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              dataKey="value"
              animationBegin={0}
              animationDuration={600}
              label={isMobile ? undefined : renderCustomizedLabel}
              labelLine={false}
            >
              {chartData.map((entry, index: number) => (
                <Cell 
                  key={`cell-${entry.ticker}`} 
                  fill={getAssetColor(index)} 
                  stroke="var(--chart-bg)" 
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--chart-tooltip-bg)',
                border: '1px solid var(--chart-tooltip-border)',
                borderRadius: '8px',
                color: 'var(--chart-tooltip-text)',
                fontSize: '12px',
              }}
              formatter={(value) => [`${value}%`, 'Weight']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Grid of legend items inspired by flat smart art */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2 mt-4 md:mt-0 w-full md:w-1/2 px-4 text-xs">
        {assets.map((asset, index) => {
          return (
            <div 
              key={asset.ticker} 
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/40 opacity-90 hover:opacity-100 hover:border-slate-200 dark:hover:border-slate-700/60 shadow-sm transition-all"
            >
              <span 
                className="w-3 h-3 rounded-full shrink-0 shadow-sm" 
                style={{ backgroundColor: getAssetColor(index) }} 
              />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm">{asset.ticker}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{asset.name}</span>
              </div>
              <span className="ml-auto font-black text-slate-700 dark:text-slate-300 shrink-0 text-sm">{asset.weight}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
