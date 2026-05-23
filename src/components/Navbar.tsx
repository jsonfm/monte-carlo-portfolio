import { TrendingUp, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/65 dark:bg-slate-950/65 backdrop-blur-md sticky top-0 z-50 px-3.5 sm:px-6 py-3 sm:py-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none m-0 p-0">MONTE CARLO</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded shrink-0">
              PRO
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate hidden min-[400px]:block">Serverless Portfolio Analytics & Risk Estimator</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold">
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          title="Toggle Light/Dark Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Security / Decentralized Badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 px-3 py-1.5 rounded-full text-[11px] text-slate-600 dark:text-slate-300 transition-colors">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Client-Side Only (No Data Ever Leaves Your Browser)</span>
        </div>

        {/* GitHub link */}
        <a
          href="https://github.com/jsonfm/monte-carlo-portfolio"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          title="View Source on GitHub"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
