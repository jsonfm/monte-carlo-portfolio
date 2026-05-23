import { FileText, Sparkles, TrendingUp, Award, Target, ShieldAlert } from 'lucide-react';

export function SimulationReportSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-sm dark:shadow-xl space-y-6 animate-pulse select-none transition-colors">
      {/* Report Header Skeleton */}
      <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-300 dark:text-slate-650">
            <FileText className="w-5 h-5 text-slate-300 dark:text-slate-700" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4.5 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
            </div>
            <div className="h-3 w-72 bg-slate-150 dark:bg-slate-900 rounded-md" />
          </div>
        </div>
        <div className="h-8 w-32 bg-slate-100 dark:bg-slate-900 rounded-lg" />
      </div>

      {/* 2-Column Section Skeleton: Profile Card + Commentary */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Card: Risk Profile (4/12 cols) */}
        <div className="md:col-span-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4.5 flex flex-col justify-between h-[154px]">
          <div>
            <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md mb-2" />
            <div className="h-4 w-36 bg-slate-300 dark:bg-slate-700 rounded-md mb-3" />
            <div className="flex gap-2">
              <div className="h-4.5 w-14 bg-slate-250 dark:bg-slate-800 rounded-full" />
              <div className="h-4.5 w-20 bg-slate-250 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-800/40 pt-3">
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-md mb-1.5" />
            <div className="h-2 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>

        {/* Right Card: Advisor Insights (8/12 cols) */}
        <div className="md:col-span-8 bg-slate-50 dark:bg-slate-900/10 border border-slate-150 dark:border-slate-800/20 rounded-2xl p-4.5 flex flex-col justify-between h-[154px]">
          <div>
            <div className="flex items-center gap-1 mb-2.5">
              <Sparkles className="w-3 h-3 text-slate-300 dark:text-slate-700" />
              <div className="h-3 w-40 bg-slate-250 dark:bg-slate-800 rounded-md" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-[98%] bg-slate-200 dark:bg-slate-850 rounded-md" />
              <div className="h-3 w-[95%] bg-slate-200 dark:bg-slate-850 rounded-md" />
              <div className="h-3 w-[97%] bg-slate-200 dark:bg-slate-850 rounded-md" />
              <div className="h-3 w-[70%] bg-slate-200 dark:bg-slate-850 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Segment: Scenarios Table + Progress Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Scenarios Table Skeleton (7/12 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-slate-300 dark:text-slate-700" />
            <div className="h-3 w-56 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    <th className="py-2.5 px-4 w-[160px]">Scenario</th>
                    <th className="py-2.5 px-3 text-right">Ending Value</th>
                    <th className="py-2.5 px-3 text-right">Gain / Loss</th>
                    <th className="py-2.5 px-4 text-right">Simulated CAGR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/40">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <tr key={idx} className={idx === 3 ? 'bg-indigo-50/10 dark:bg-indigo-950/5' : ''}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-3.5 rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="space-y-1">
                            <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                            <div className="h-2 w-16 bg-slate-150 dark:bg-slate-900 rounded-md" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-4.5 w-16 bg-slate-300 dark:bg-slate-700 rounded-md ml-auto" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-3.5 w-14 bg-slate-200 dark:bg-slate-800 rounded-md ml-auto mb-1" />
                        <div className="h-2.5 w-8 bg-slate-150 dark:bg-slate-900 rounded-md ml-auto" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-3.5 w-10 bg-slate-200 dark:bg-slate-800 rounded-md ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Milestones Skeleton (5/12 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-slate-300 dark:text-slate-700" />
            <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/40 rounded-2xl p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                  <div className="h-4 w-8 bg-slate-250 dark:bg-slate-750 rounded-md" />
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-900 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Solver Skeleton */}
      <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800/30 rounded-2xl p-4.5 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-lg w-full">
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-slate-300 dark:text-slate-700 animate-pulse" />
              <div className="h-3.5 w-48 bg-slate-250 dark:bg-slate-800 rounded-md" />
            </div>
            <div className="h-2.5 w-[90%] bg-slate-150 dark:bg-slate-900 rounded-md" />
            <div className="h-2.5 w-[75%] bg-slate-150 dark:bg-slate-900 rounded-md" />
          </div>

          <div className="flex flex-wrap gap-4 items-center shrink-0">
            <div className="h-9 w-40 bg-slate-150 dark:bg-slate-900 rounded-xl" />
            <div className="h-9 w-[150px] bg-slate-150 dark:bg-slate-900 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Downside protection & Tail risk Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-slate-300 dark:text-slate-700" />
          <div className="h-3 w-64 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className="bg-slate-50 dark:bg-slate-900/30 p-3.5 border border-slate-200 dark:border-slate-800/40 rounded-xl space-y-2">
              <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-5 w-24 bg-slate-300 dark:bg-slate-700 rounded-md" />
              <div className="space-y-1">
                <div className="h-2 w-full bg-slate-150 dark:bg-slate-900 rounded-md" />
                <div className="h-2 w-[80%] bg-slate-150 dark:bg-slate-900 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
