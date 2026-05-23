import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export function Glossary() {
  const [isOpen, setIsOpen] = useState(false);

  const terms = [
    {
      term: 'CAGR (Compound Annual Growth Rate)',
      definition: 'The geometric annualized rate of return, representing the smoothed yearly growth rate of an investment assuming compound reinvestment.',
    },
    {
      term: 'Volatility (Annualized Standard Deviation)',
      definition: 'The statistical dispersion of asset returns. Higher volatility indicates wider historical fluctuations and greater price uncertainty (risk).',
    },
    {
      term: 'Sharpe Ratio',
      definition: "A metric of risk-adjusted efficiency, calculated as excess return (above a risk-free rate) divided by volatility. Values above 1.0 are generally considered solid.",
    },
    {
      term: 'Sortino Ratio',
      definition: 'An efficiency ratio similar to the Sharpe Ratio, but only penalizing downside volatility (negative returns), making it more suitable for asymmetric risk profiles.',
    },
    {
      term: 'Value at Risk (95% VaR)',
      definition: 'An institutional risk metric indicating the maximum expected loss on your starting principal with 95% confidence (i.e. only a 5% chance of doing worse).',
    },
    {
      term: 'Expected Shortfall (95% CVaR)',
      definition: 'Also known as Conditional Value at Risk. This represents the average outcome in the worst-case 5% of trials, evaluating the severity of extreme tail-risk.',
    },
    {
      term: 'Max Drawdown',
      definition: 'The peak-to-trough decline in portfolio valuation, representing the deepest paper loss experienced during a specific history or simulated trail.',
    },
    {
      term: "Jensen's Alpha",
      definition: "The statistical measure of excess risk-adjusted return relative to a benchmark. A positive alpha indicates active manager outperformance.",
    },
    {
      term: 'Portfolio Beta',
      definition: 'The systematic sensitivity of the portfolio relative to a benchmark. A beta of 1.0 means the portfolio moves closely in lockstep with the benchmark.',
    },
    {
      term: 'Correlation (R-squared)',
      definition: 'The statistical alignment of returns between your portfolio and the benchmark. A high correlation (e.g. 90%+) indicates co-movement.',
    },
    {
      term: 'Percentile Outcomes',
      definition: 'Ranking thresholds indicating probability. The 50th percentile (median) represents the midpoint outcome with equal odds above or below.',
    },
    {
      term: 'Nominal vs Real Values',
      definition: 'Nominal values display unadjusted absolute dollars. Real values are discounted by inflation, displaying future balances in terms of today’s true purchasing power.',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm transition-colors print:hidden">
      
      {/* Header / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left cursor-pointer group select-none"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400 group-hover:scale-105 transition-transform" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Financial Terminology Glossary</h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-normal leading-none">
              Plain-English definitions for standard industry metrics used throughout this dashboard.
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        )}
      </button>

      {/* Accordion Body */}
      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/20 text-xs">
          {terms.map((item, idx) => (
            <div key={idx} className="space-y-1 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-200/40 dark:border-slate-850/40">
              <h5 className="font-extrabold text-slate-800 dark:text-slate-200 leading-tight">
                {item.term}
              </h5>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Glossary;
