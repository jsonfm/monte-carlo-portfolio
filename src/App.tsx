import { AlertCircle, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AssetInput } from '@/components/AssetInput';
import { SimulationControls } from '@/components/SimulationControls';
import { AllocationPieChart } from '@/components/AllocationPieChart';
import { MetricsDisplay } from '@/components/MetricsDisplay';
import { DashboardCharts } from '@/components/DashboardCharts';
import { SimulationReport } from '@/components/SimulationReport';
import { MethodologyDocs } from '@/components/MethodologyDocs';
import { usePortfolioState } from '@/hooks/usePortfolioState';
import { useHistoricalBacktest } from '@/hooks/useHistoricalBacktest';

export default function App() {
  const {
    rememberSelection,
    setRememberSelection,
    assets,
    setAssets,
    initialInvestment,
    setInitialInvestment,
    horizonYears,
    setHorizonYears,
    simulationsCount,
    setSimulationsCount,
    model,
    setModel,
    rebalanceFrequency,
    setRebalanceFrequency,
    benchmarkTicker,
    setBenchmarkTicker,
    historicalRange,
    setHistoricalRange,
    monthlyContribution,
    setMonthlyContribution,
    monthlyWithdrawal,
    setMonthlyWithdrawal,
    adjustInflation,
    setAdjustInflation,
    annualInflationRate,
    setAnnualInflationRate,
    isTaxable,
    setIsTaxable,
    capitalGainsTaxRate,
    setCapitalGainsTaxRate,
    transactionFeeRate,
    setTransactionFeeRate,
    rebalanceThreshold,
    setRebalanceThreshold,
    bootstrapBlockSize,
    setBootstrapBlockSize,
    useGarch,
    setUseGarch,
    useMertonJumps,
    setUseMertonJumps,
    handleReset,
  } = usePortfolioState();

  const {
    historicalMetrics,
    historicalLoading,
    historicalError,
    simLoading,
    simError,
    simResult,
    isAllocationValid,
    loadDataAndBacktest,
    handleQuickRunSimulation,
    handleResetCaches,
  } = useHistoricalBacktest({
    assets,
    benchmarkTicker,
    historicalRange,
    initialInvestment,
    horizonYears,
    simulationsCount,
    model,
    rebalanceFrequency,
    monthlyContribution,
    monthlyWithdrawal,
    adjustInflation,
    annualInflationRate,
    isTaxable,
    capitalGainsTaxRate,
    transactionFeeRate,
    rebalanceThreshold,
    bootstrapBlockSize,
    useGarch,
    useMertonJumps,
  });

  const handleCombinedReset = () => {
    handleReset();
    handleResetCaches();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 pb-12 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Setup Column (4/12 cols) */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl space-y-5 sm:space-y-6 shadow-sm dark:shadow-xl transition-colors">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">Portfolio Designer</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Configure your asset weights and risk factors.</p>
              </div>
              <div className="flex items-center gap-2 mt-1 shrink-0 self-end sm:self-auto">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 select-none">
                  <span>Remember Selection</span>
                  <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors duration-200 ease-in-out ${rememberSelection ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={rememberSelection}
                      onChange={(e) => setRememberSelection(e.target.checked)}
                    />
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out ${rememberSelection ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>
            </div>

            <AssetInput 
              assets={assets} 
              onChange={setAssets} 
            />
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl space-y-5 sm:space-y-6 shadow-sm dark:shadow-xl transition-colors">
            <SimulationControls 
              initialInvestment={initialInvestment}
              setInitialInvestment={setInitialInvestment}
              horizonYears={horizonYears}
              setHorizonYears={setHorizonYears}
              simulationsCount={simulationsCount}
              setSimulationsCount={setSimulationsCount}
              model={model}
              setModel={setModel}
              rebalanceFrequency={rebalanceFrequency}
              setRebalanceFrequency={setRebalanceFrequency}
              benchmarkTicker={benchmarkTicker}
              setBenchmarkTicker={setBenchmarkTicker}
              historicalRange={historicalRange}
              setHistoricalRange={setHistoricalRange}
              monthlyContribution={monthlyContribution}
              setMonthlyContribution={setMonthlyContribution}
              monthlyWithdrawal={monthlyWithdrawal}
              setMonthlyWithdrawal={setMonthlyWithdrawal}
              adjustInflation={adjustInflation}
              setAdjustInflation={setAdjustInflation}
              annualInflationRate={annualInflationRate}
              setAnnualInflationRate={setAnnualInflationRate}
              isTaxable={isTaxable}
              setIsTaxable={setIsTaxable}
              capitalGainsTaxRate={capitalGainsTaxRate}
              setCapitalGainsTaxRate={setCapitalGainsTaxRate}
              transactionFeeRate={transactionFeeRate}
              setTransactionFeeRate={setTransactionFeeRate}
              rebalanceThreshold={rebalanceThreshold}
              setRebalanceThreshold={setRebalanceThreshold}
              bootstrapBlockSize={bootstrapBlockSize}
              setBootstrapBlockSize={setBootstrapBlockSize}
              useGarch={useGarch}
              setUseGarch={setUseGarch}
              useMertonJumps={useMertonJumps}
              setUseMertonJumps={setUseMertonJumps}
              onRunSimulation={handleQuickRunSimulation}
              onReset={handleCombinedReset}
              isValid={isAllocationValid}
              loading={historicalLoading || simLoading}
            />
          </div>
        </section>

        {/* Right Side: Dashboard Area (8/12 cols) */}
        <section className="lg:col-span-8 space-y-6">
          {/* Loaders and Error Displays */}
          {historicalError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-3 text-xs leading-relaxed shadow-lg">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Market Data Error</p>
                <p className="text-[11px] text-rose-300/90 mt-0.5">{historicalError}</p>
                <button 
                  onClick={() => loadDataAndBacktest(true)} 
                  className="mt-2 text-[10px] uppercase font-bold tracking-wider underline text-blue-400 hover:text-blue-300"
                >
                  Retry Loading Prices
                </button>
              </div>
            </div>
          )}

          {simError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-3 text-xs leading-relaxed shadow-lg">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Simulation Failure</p>
                <p className="text-[11px] text-rose-300/90 mt-0.5">{simError}</p>
              </div>
            </div>
          )}

          {historicalLoading && !historicalMetrics && (
            <div className="bg-slate-100/50 dark:bg-slate-950/40 p-8 border border-slate-200 dark:border-slate-800/40 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 h-96 transition-colors">
              <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syncing Market Histories...</p>
              <p className="text-[11px] text-slate-500 max-w-xs">Connecting to decentralized APIs to fetch adjusted closes for {assets.map(a => a.ticker).join(', ')}.</p>
            </div>
          )}

          {/* Main Dashboard Cards */}
          {historicalMetrics && (
            <div className="relative">
              {historicalLoading && (
                <div className="absolute inset-0 bg-slate-50/40 dark:bg-[#0b0f19]/40 backdrop-blur-[1.5px] z-20 rounded-3xl flex items-center justify-center transition-all duration-300">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-5 rounded-2xl shadow-xl flex items-center gap-3.5 max-w-xs animate-in fade-in zoom-in-95 duration-200">
                    <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Refreshing Market Data</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Updating historical closes & aligned returns...</p>
                    </div>
                  </div>
                </div>
              )}

              <div className={`space-y-6 transition-all duration-200 ${historicalLoading ? 'pointer-events-none select-none filter blur-[0.5px] opacity-75' : ''}`}>
                {/* Allocation Pie Chart Display */}
                <div className="bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm dark:shadow-xl space-y-4 transition-colors">
                  <div>
                    <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight leading-none uppercase">Target Allocation</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">Vibrant visualization of your portfolio balance.</p>
                  </div>
                  <AllocationPieChart assets={assets} />
                </div>

                {/* Header metrics bar */}
                <div className="bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-800/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm dark:shadow-xl transition-colors">
                  <MetricsDisplay 
                    historicalData={historicalMetrics} 
                    simulationData={simResult} 
                  />
                </div>

                {/* Dashboard charts including controls */}
                <DashboardCharts 
                  historicalMetrics={historicalMetrics}
                  simResult={simResult}
                  simLoading={simLoading}
                  benchmarkTicker={benchmarkTicker}
                />

                {/* Simulation Report Summary */}
                <SimulationReport 
                  simulationData={simResult}
                  assets={assets}
                  model={model}
                  rebalanceFrequency={rebalanceFrequency}
                  horizonYears={horizonYears}
                  simulationsCount={simulationsCount}
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
                />

                {/* Methodology Explanations card */}
                <MethodologyDocs />
              </div>
            </div>
          )}

          {/* Prompt when no portfolio is available */}
          {!historicalLoading && !historicalMetrics && !historicalError && (
            <div className="bg-white/50 dark:bg-slate-950/30 p-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-4 h-96 transition-colors">
              <ShieldCheck className="w-10 h-10 text-slate-400 dark:text-slate-700 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">Awaiting Design Configurations</h3>
                <p className="text-[11px] text-slate-500 max-w-sm mt-1 mx-auto">
                  Use the left sidebar to structure your portfolio allocation. Once your target weight hits 100%, the simulation engine will launch.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
