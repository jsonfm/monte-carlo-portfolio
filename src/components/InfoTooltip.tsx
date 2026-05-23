import { Info } from 'lucide-react';
import React from 'react';

interface InfoTooltipProps {
  content: React.ReactNode;
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <div className="relative group inline-flex items-center justify-center">
      <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-help" />
      
      {/* Tooltip Content */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 dark:bg-slate-800 text-slate-200 text-[11px] leading-relaxed rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none border border-slate-700 dark:border-slate-700/80">
        {content}
        {/* Triangle Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-800 dark:border-t-slate-800" />
      </div>
    </div>
  );
}
