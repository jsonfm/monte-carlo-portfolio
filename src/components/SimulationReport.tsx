import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { Asset, SimulationSummary, HistoricalMetrics } from '@/types';

import { SimulationReportSkeleton } from '@/components/report/SimulationReportSkeleton';
import { ExecutiveSummary } from '@/components/report/ExecutiveSummary';
import { CompositionAnalysis } from '@/components/report/CompositionAnalysis';
import { PerformanceProjection } from '@/components/report/PerformanceProjection';
import { RiskAssessment } from '@/components/report/RiskAssessment';
import { BenchmarkComparison } from '@/components/report/BenchmarkComparison';
import { GoalSolver } from '@/components/report/GoalSolver';
import { StrategicRecommendations } from '@/components/report/StrategicRecommendations';
import { MethodologySettings } from '@/components/report/MethodologySettings';
import { ExportBar } from '@/components/report/ExportBar';

interface SimulationReportProps {
  simulationData: SimulationSummary | null;
  historicalData: HistoricalMetrics | null;
  assets: Asset[];
  model?: 'gbm' | 'bootstrap';
  rebalanceFrequency?: 'none' | 'monthly' | 'annually' | 'threshold';
  horizonYears?: number;
  simulationsCount?: number;
  monthlyContribution?: number;
  monthlyWithdrawal?: number;
  adjustInflation?: boolean;
  annualInflationRate?: number;
  isTaxable?: boolean;
  capitalGainsTaxRate?: number;
  transactionFeeRate?: number;
  rebalanceThreshold?: number;
  bootstrapBlockSize?: number;
  useGarch?: boolean;
  useMertonJumps?: boolean;
}

export function SimulationReport({
  simulationData,
  historicalData,
  assets,
  model = 'gbm',
  rebalanceFrequency = 'none',
  horizonYears: horizonYearsProp,
  simulationsCount = 5000,
  monthlyContribution = 0,
  monthlyWithdrawal = 0,
  adjustInflation = false,
  annualInflationRate = 0.03,
  isTaxable = false,
  capitalGainsTaxRate = 0.15,
  transactionFeeRate = 0.001,
  rebalanceThreshold = 5,
  bootstrapBlockSize = 10,
  useGarch = false,
  useMertonJumps = false,
}: SimulationReportProps) {
  const [customGoal, setCustomGoal] = useState<string>('');

  const horizonYears = horizonYearsProp ?? (simulationData ? simulationData.percentiles.p50.length - 1 : 10);

  if (!simulationData) {
    return <SimulationReportSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800/80 rounded-4xl p-6 sm:p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] space-y-14 transition-colors print-report-full max-w-6xl mx-auto">
      
      {/* Style overrides for custom report layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Hide native scrollbars for scrollable report nav */
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;     /* Firefox */
        }

        @media print {
          /* Hide non-report layout structures */
          body, html {
            background: white !important;
            color: black !important;
          }
          header, nav, aside, footer, .print-hidden, button, input, select {
            display: none !important;
          }
          /* Unwrap report container */
          .print-report-full {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            color: black !important;
          }
          /* Force standard typography scaling */
          h2, h3, h4, span, p, td, th {
            color: black !important;
          }
          .grid {
            display: block !important;
          }
          .col-span-1, .col-span-2, .col-span-3, .col-span-4, .col-span-5, .col-span-6, .col-span-7, .col-span-8, .col-span-9, .col-span-10, .col-span-11, .col-span-12 {
            width: 100% !important;
            margin-bottom: 1.5rem !important;
          }
          .print-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}} />

      {/* Report Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-slate-900/10 dark:border-slate-100/10 print:border-black/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-900 dark:bg-white rounded-2xl text-white dark:text-slate-900 print:bg-slate-900 print:text-white shadow-md">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Quantitative Portfolio Simulation
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <span>Executive Advisory Report</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span>{simulationData.finalValues.length.toLocaleString()} Trials</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span>Prepared {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Action Export Bar */}
        <div className="shrink-0">
            <ExportBar
            simulationData={simulationData}
            historicalData={historicalData}
            assets={assets}
            horizonYears={horizonYears}
            model={model}
            rebalanceFrequency={rebalanceFrequency}
            monthlyContribution={monthlyContribution}
            monthlyWithdrawal={monthlyWithdrawal}
            adjustInflation={adjustInflation}
            annualInflationRate={annualInflationRate}
            isTaxable={isTaxable}
            capitalGainsTaxRate={capitalGainsTaxRate}
            transactionFeeRate={transactionFeeRate}
            rebalanceThreshold={rebalanceThreshold}
            bootstrapBlockSize={bootstrapBlockSize}
            useGarch={useGarch}
            useMertonJumps={useMertonJumps}
            customGoal={customGoal}
          />
        </div>
      </div>

      {/* Subsections container */}
      <div className="space-y-12">
        
        {/* SECTION 1: Executive Summary */}
        <div id="section-exec" className="scroll-mt-6 space-y-6">
          <ExecutiveSummary
            simulationData={simulationData}
            historicalData={historicalData}
            assets={assets}
            horizonYears={horizonYears}
          />
          <MethodologySettings
            model={model}
            horizonYears={horizonYears}
            simulationsCount={simulationsCount}
            monthlyContribution={monthlyContribution}
            monthlyWithdrawal={monthlyWithdrawal}
            adjustInflation={adjustInflation}
            annualInflationRate={annualInflationRate}
            isTaxable={isTaxable}
            capitalGainsTaxRate={capitalGainsTaxRate}
            transactionFeeRate={transactionFeeRate}
            rebalanceFrequency={rebalanceFrequency}
            rebalanceThreshold={rebalanceThreshold}
            bootstrapBlockSize={bootstrapBlockSize}
            useGarch={useGarch}
            useMertonJumps={useMertonJumps}
          />
        </div>

        {/* SECTION 2: Composition Analysis */}
        <div id="section-comp" className="scroll-mt-6 pt-2 print-break-before">
          <CompositionAnalysis assets={assets} />
        </div>

        {/* SECTION 3: Performance Projection */}
        <div id="section-perf" className="scroll-mt-6 pt-2 print-break-before">
          <PerformanceProjection
            simulationData={simulationData}
            assets={assets}
            horizonYears={horizonYears}
            adjustInflation={adjustInflation}
            annualInflationRate={annualInflationRate}
            customGoal={customGoal}
          />
        </div>

        {/* SECTION 4: Risk Assessment */}
        <div id="section-risk" className="scroll-mt-6 pt-2 print-break-before">
          <RiskAssessment
            simulationData={simulationData}
            horizonYears={horizonYears}
            monthlyWithdrawal={monthlyWithdrawal}
            adjustInflation={adjustInflation}
            annualInflationRate={annualInflationRate}
          />
        </div>

        {/* SECTION 5: Benchmark Comparison */}
        <div id="section-bench" className="scroll-mt-6 pt-2 print-break-before">
          <BenchmarkComparison
            historicalData={historicalData}
            benchmarkTicker={model === 'gbm' ? 'Benchmark' : 'Historical'}
          />
        </div>

        {/* SECTION 6: Goal Solver Card */}
        <div className="pt-2 print-break-before">
          <GoalSolver
            simulationData={simulationData}
            horizonYears={horizonYears}
            customGoal={customGoal}
            setCustomGoal={setCustomGoal}
          />
        </div>

        {/* SECTION 7: Strategic Recommendations */}
        <div id="section-recs" className="scroll-mt-6 pt-2 print-break-before">
          <StrategicRecommendations
            assets={assets}
            horizonYears={horizonYears}
            simulationData={simulationData}
            historicalData={historicalData}
            rebalanceFrequency={rebalanceFrequency}
            useMertonJumps={useMertonJumps}
            monthlyWithdrawal={monthlyWithdrawal}
            adjustInflation={adjustInflation}
          />
        </div>


      </div>

    </div>
  );
}
