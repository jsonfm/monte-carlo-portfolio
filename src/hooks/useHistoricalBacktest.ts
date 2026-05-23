import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Asset, HistoricalMetrics, AssetHistory, HistoricalPrice, HistoricalRange } from '@/types';
import { fetchHistoricalData, alignHistoricalData } from '@/services/dataService';
import { compileHistoricalMetrics } from '@/utils/mathEngine';
import { useSimulation } from './useSimulation';

interface UseHistoricalBacktestProps {
  assets: Asset[];
  benchmarkTicker: string;
  historicalRange: HistoricalRange;
  customCsvPrices: { [ticker: string]: HistoricalPrice[] };
  initialInvestment: number;
  horizonYears: number;
  simulationsCount: number;
  model: 'gbm' | 'bootstrap';
  rebalanceFrequency: 'none' | 'monthly' | 'annually' | 'threshold';
  monthlyContribution: number;
  monthlyWithdrawal: number;
  adjustInflation: boolean;
  annualInflationRate: number;
  isTaxable: boolean;
  capitalGainsTaxRate: number;
  transactionFeeRate: number;
  rebalanceThreshold: number;
  bootstrapBlockSize: number;
  useGarch: boolean;
  useMertonJumps: boolean;
}

export function useHistoricalBacktest({
  assets,
  benchmarkTicker,
  historicalRange,
  customCsvPrices,
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
}: UseHistoricalBacktestProps) {
  const [historicalMetrics, setHistoricalMetrics] = useState<HistoricalMetrics | null>(null);
  const [historicalLoading, setHistoricalLoading] = useState<boolean>(false);
  const [historicalError, setHistoricalError] = useState<string | null>(null);

  // Simulation custom hook
  const { 
    loading: simLoading, 
    error: simError, 
    result: simResult, 
    runMonteCarlo, 
    cancelSimulation 
  } = useSimulation();

  // Validations
  const totalWeight = useMemo(() => assets.reduce((sum, a) => sum + a.weight, 0), [assets]);
  const isAllocationValid = totalWeight === 100 && assets.length > 0;

  // Track the raw asset histories cache so we don't have to re-fetch if we just change weights/simulation params
  const assetsHistoriesCacheRef = useRef<{ [ticker: string]: HistoricalPrice[] }>({});
  const benchmarkHistoryCacheRef = useRef<{ ticker: string; prices: HistoricalPrice[] } | null>(null);

  // Main task to load all price data and backtest
  const loadDataAndBacktest = useCallback(async (forceFetch = false) => {
    if (assets.length === 0) {
      setTimeout(() => {
        setHistoricalMetrics(null);
      }, 0);
      return;
    }

    // Check if we actually need to show a loading screen (network fetch)
    const updatedCache = { ...assetsHistoriesCacheRef.current };
    let needsNetworkFetch = forceFetch;

    // Check benchmark cache
    const cachedBench = benchmarkHistoryCacheRef.current;
    if (!cachedBench || cachedBench.ticker !== benchmarkTicker) {
      needsNetworkFetch = true;
    }

    // Check assets cache
    if (!needsNetworkFetch) {
      for (const asset of assets) {
        if (!updatedCache[asset.ticker] && !customCsvPrices[asset.ticker]) {
          needsNetworkFetch = true;
          break;
        }
      }
    }

    if (needsNetworkFetch) {
      setTimeout(() => {
        setHistoricalLoading(true);
        setHistoricalError(null);
      }, 0);
    } else {
      setTimeout(() => {
        setHistoricalError(null);
      }, 0);
    }

    try {
      const historiesToAlign: { ticker: string; prices: HistoricalPrice[] }[] = [];

      // 1. Fetch/Resolve histories for all current assets
      const updatedCache = { ...assetsHistoriesCacheRef.current };

      // Ensure any custom CSV uploaded prices are copied to cache
      Object.entries(customCsvPrices).forEach(([ticker, prices]) => {
        updatedCache[ticker] = prices;
      });

      for (const asset of assets) {
        let prices = updatedCache[asset.ticker];

        // If not in cache (or forceFetch), fetch it!
        if (!prices || forceFetch) {
          // Check if it's a custom uploaded CSV asset first
          if (customCsvPrices[asset.ticker]) {
            prices = customCsvPrices[asset.ticker];
          } else {
            // Fetch from Yahoo Finance
            prices = await fetchHistoricalData(asset.ticker, '10y');
          }
          updatedCache[asset.ticker] = prices;
        }

        historiesToAlign.push({ ticker: asset.ticker, prices });
      }

      assetsHistoriesCacheRef.current = updatedCache;

      // 2. Fetch/Resolve benchmark history
      let benchmarkPrices: HistoricalPrice[] = [];
      const cachedBench = benchmarkHistoryCacheRef.current;
      if (cachedBench && cachedBench.ticker === benchmarkTicker && !forceFetch) {
        benchmarkPrices = cachedBench.prices;
      } else {
        benchmarkPrices = await fetchHistoricalData(benchmarkTicker, '10y');
        benchmarkHistoryCacheRef.current = { ticker: benchmarkTicker, prices: benchmarkPrices };
      }

      // 3. Align portfolio assets historical data
      const { dates, alignedPrices } = alignHistoricalData(historiesToAlign);
      if (dates.length < 30) {
        throw new Error('Not enough overlapping trading days to align historical data. Please verify your assets traded concurrently.');
      }

      // 4. Align the benchmark to the same historical date range
      // Map benchmark prices by date for fast lookup
      const benchMap = new Map<string, number>();
      benchmarkPrices.forEach(p => benchMap.set(p.date, p.price));

      const finalDates: string[] = [];
      const finalAlignedPrices: { [ticker: string]: number }[] = [];
      const finalBenchmarkPrices: number[] = [];

      let lastKnownBenchPrice = benchmarkPrices[0]?.price;

      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        let bPrice = benchMap.get(date);

        if (bPrice !== undefined) {
          lastKnownBenchPrice = bPrice;
        } else {
          bPrice = lastKnownBenchPrice;
        }

        // Only include if we have a benchmark price
        if (bPrice !== undefined) {
          finalDates.push(date);
          finalAlignedPrices.push(alignedPrices[i]);
          finalBenchmarkPrices.push(bPrice);
        }
      }

      // 5. Slice client-side based on historicalRange
      let slicedDates = finalDates;
      let slicedAlignedPrices = finalAlignedPrices;
      let slicedBenchmarkPrices = finalBenchmarkPrices;

      const rangeYearsMap: { [key: string]: number } = {
        '1y': 1,
        '3y': 3,
        '5y': 5,
        '10y': 10,
      };
      const yearsLimit = rangeYearsMap[historicalRange] || 5;

      if (finalDates.length > 0 && historicalRange !== '10y') {
        const latestDateObj = new Date(finalDates[finalDates.length - 1]);
        const cutoffDateObj = new Date(latestDateObj);
        cutoffDateObj.setUTCFullYear(cutoffDateObj.getUTCFullYear() - yearsLimit);
        const cutoffStr = cutoffDateObj.toISOString().split('T')[0];

        const startIndex = finalDates.findIndex(d => d >= cutoffStr);
        if (startIndex > 0) {
          slicedDates = finalDates.slice(startIndex);
          slicedAlignedPrices = finalAlignedPrices.slice(startIndex);
          slicedBenchmarkPrices = finalBenchmarkPrices.slice(startIndex);
        }
      }

      // 6. Compile historical portfolio vs benchmark metrics
      const weightsMap: { [ticker: string]: number } = {};
      assets.forEach(a => {
        weightsMap[a.ticker] = a.weight;
      });

      const metrics = compileHistoricalMetrics(
        slicedDates,
        slicedAlignedPrices,
        weightsMap,
        slicedBenchmarkPrices
      );

      setHistoricalMetrics(metrics);
      setHistoricalLoading(false);

      // 7. Trigger Monte Carlo simulation using the newly aligned returns
      if (isAllocationValid) {
        // Compile AssetHistory structures for the worker
        const assetsHistoriesForWorker: AssetHistory[] = assets.map(asset => {
          // Filter to match aligned dates exactly
          const alignedAssetPrices = slicedDates.map((_, idx) => slicedAlignedPrices[idx][asset.ticker]);
          
          // Re-calculate daily returns for these aligned prices
          const returns: number[] = [];
          for (let t = 1; t < alignedAssetPrices.length; t++) {
            returns.push((alignedAssetPrices[t] - alignedAssetPrices[t-1]) / alignedAssetPrices[t-1]);
          }

          // Compute annualized metrics based on aligned data
          const years = slicedDates.length / 252;
          const cagr = Math.pow(alignedAssetPrices[alignedAssetPrices.length - 1] / alignedAssetPrices[0], 1 / years) - 1;
          
          // Volatility
          const meanRet = returns.reduce((a, b) => a + b, 0) / returns.length;
          const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanRet, 2), 0) / (returns.length - 1);
          const volatility = Math.sqrt(variance) * Math.sqrt(252);

          return {
            ticker: asset.ticker,
            prices: slicedDates.map((d, idx) => ({ date: d, price: slicedAlignedPrices[idx][asset.ticker] })),
            returns,
            cagr: isNaN(cagr) ? 0 : cagr,
            volatility: isNaN(volatility) ? 0 : volatility,
          };
        });

        runMonteCarlo({
          assets,
          assetsHistory: assetsHistoriesForWorker,
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
      }
    } catch (err) {
      console.error('Data Loading Error:', err);
      setHistoricalError(err instanceof Error ? err.message : 'Failed to fetch historical market data');
      setHistoricalLoading(false);
    }
  }, [
    assets,
    benchmarkTicker,
    historicalRange,
    customCsvPrices,
    isAllocationValid,
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
    runMonteCarlo,
  ]);

  // Trigger data reload and backtesting with a debounced delay (350ms)
  // to avoid overloading the CPU and spawning excessive Web Workers during rapid typing or slider dragging
  useEffect(() => {
    const timer = setTimeout(() => {
      loadDataAndBacktest();
    }, 350);
    return () => clearTimeout(timer);
  }, [loadDataAndBacktest]);

  // Trigger quick simulation rerun without fetching if only weights or simulation settings change
  const handleQuickRunSimulation = useCallback(() => {
    if (!isAllocationValid || !historicalMetrics) return;

    // Use cached histories to run simulation instantly
    const finalDates = historicalMetrics.dates;
    
    const assetsHistoriesForWorker: AssetHistory[] = assets.map(asset => {
      const rawPrices = assetsHistoriesCacheRef.current[asset.ticker] || [];
      
      // Pull actual aligned prices from our historicalMetrics
      // We can map from historicalMetrics to make it 100% correct
      const pricesMap = historicalMetrics.dates.map(d => {
        return { date: d, price: rawPrices.find(p => p.date === d)?.price || rawPrices[0]?.price || 0 };
      });

      const alignedPrices = pricesMap.map(p => p.price);
      const returns: number[] = [];
      for (let t = 1; t < alignedPrices.length; t++) {
        returns.push((alignedPrices[t] - alignedPrices[t-1]) / alignedPrices[t-1]);
      }

      const years = finalDates.length / 252;
      const cagr = Math.pow(alignedPrices[alignedPrices.length - 1] / alignedPrices[0], 1 / years) - 1;
      
      const meanRet = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanRet, 2), 0) / (returns.length - 1);
      const volatility = Math.sqrt(variance) * Math.sqrt(252);

      return {
        ticker: asset.ticker,
        prices: pricesMap,
        returns,
        cagr: isNaN(cagr) ? 0 : cagr,
        volatility: isNaN(volatility) ? 0 : volatility,
      };
    });

    runMonteCarlo({
      assets,
      assetsHistory: assetsHistoriesForWorker,
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
  }, [
    assets,
    isAllocationValid,
    historicalMetrics,
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
    runMonteCarlo,
  ]);

  const handleResetCaches = useCallback(() => {
    cancelSimulation();
    setHistoricalMetrics(null);
    setHistoricalError(null);
    assetsHistoriesCacheRef.current = {};
    benchmarkHistoryCacheRef.current = null;
  }, [cancelSimulation]);

  return {
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
  };
}
