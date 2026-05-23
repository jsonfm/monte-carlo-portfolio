import { BookOpen, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { MathJax } from 'better-react-mathjax';

function BlockMath({ math }: { math: string }) {
  return (
    <div className="w-full overflow-x-auto flex justify-center py-1">
      <MathJax>{`$$${math}$$`}</MathJax>
    </div>
  );
}

function InlineMath({ math }: { math: string }) {
  return <MathJax inline>{`\\(${math}\\)`}</MathJax>;
}

export function MethodologyDocs() {
  return (
    <div className="bg-white dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-5 space-y-4 shadow-sm transition-colors">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Mathematical Methodology & Estimation Models</h3>
      </div>
      
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        This application runs fully client-side using advanced quantitative finance algorithms. Below is an overview of the model mechanics, risk adjustments, and asset class considerations.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* GBM Section */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Geometric Brownian Motion (GBM)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            GBM is the industry-standard continuous-time stochastic process used to model asset prices over time. The asset price follows this stochastic differential equation:
          </p>
          <div className="bg-white dark:bg-slate-900/50 p-2.5 rounded-lg text-slate-800 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-800/50">
            <BlockMath math={"dS_t = \\mu S_t dt + \\sigma S_t dW_t"} />
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Where <InlineMath math={"\\mu"} /> is the drift (expected CAGR), <InlineMath math={"\\sigma"} /> is the annualized volatility, and <InlineMath math={"dW_t"} /> is a standard Wiener process.
          </p>
        </div>

        {/* Cholesky Section */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wide">
            <Scale className="w-3.5 h-3.5" />
            <span>Asset Correlation (Cholesky Factor)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            To simulate realistic portfolios, we compute the historical covariance matrix <InlineMath math={"\\Sigma"} /> and perform a Cholesky Decomposition:
          </p>
          <div className="bg-white dark:bg-slate-900/50 p-2.5 rounded-lg text-slate-800 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-800/50">
            <BlockMath math={"\\Sigma = L L^T"} />
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            When we generate independent normal variables <InlineMath math={"\\mathbf{Z}"} />, we multiply them by <InlineMath math={"L"} /> to obtain correlated normal variables: <InlineMath math={"\\mathbf{X} = L \\mathbf{Z}"} />.
          </p>
        </div>

        {/* Historical Bootstrapping Section */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wide">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Historical Bootstrapping</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            For assets with non-normal distributions (like Cryptocurrencies), parametric models can underestimate downside risk.
          </p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Under <strong>Historical Bootstrapping</strong>, we randomly sample actual daily returns from history. Crucially, we resample <strong>entire trading days</strong> across the assets simultaneously. This preserves the exact historical correlation without needing to assume a normal distribution.
          </p>
        </div>

        {/* Risk Metrics Section */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wide">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Value at Risk (VaR)</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            To gauge the severe worst-case scenarios, we calculate two standardized risk metrics at the 95% confidence interval:
          </p>
          <ul className="text-[10px] text-slate-500 space-y-1 list-disc pl-4">
            <li>
              <strong>95% VaR:</strong> The maximum amount of capital you are expected to lose with 95% confidence. There is only a 5% chance your portfolio will perform worse than this.
            </li>
            <li>
              <strong>95% CVaR:</strong> If you do land in that worst 5% of outcomes, CVaR is the average expected loss.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Simple Helper component for the Icon
function Scale({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-.87.65-2.24 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-2.24 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h18" />
    </svg>
  );
}
