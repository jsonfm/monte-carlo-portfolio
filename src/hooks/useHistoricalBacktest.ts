import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Asset, HistoricalMetrics, AssetHistory, HistoricalPrice, HistoricalRange } from '@/types';
import { fetchHistoricalData, alignHistoricalData } from '@/services/dataService';
import { compileHistoricalMetrics } from '@/utils/mathEngine';
import { useSimulation } from './useSimulation';

interface UseHistoricalBacktestProps {
  assets: Asset[];
  benchmarkTicker: string;
  historicalRange: HistoricalRange;
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
  const [dataWarning, setDataWarning] = useState<string | null>(null);

  // Simulation custom hook
  const {
    loading: simLoading,
    error: simError,
    result: simResult,
    runMonteCarlo,
    cancelSimulation,
  } = useSimulation();

  // Validations
  const totalWeight = useMemo(() => assets.reduce((sum, a) => sum + a.weight, 0), [assets]);
  const isAllocationValid = totalWeight === 100 && assets.length > 0;

  // Track raw asset histories so we don't have to re-fetch when only weights / sim params change
  const assetsHistoriesCacheRef = useRef<{ [ticker: string]: HistoricalPrice[] }>({});
  const benchmarkHistoryCacheRef = useRef<{ ticker: string; prices: HistoricalPrice[] } | null>(null);

  // Cache the per-asset MC inputs from the most recent successful backtest. Quick reruns
  // (weight tweaks, sim-parameter changes) replay these directly to avoid re-deriving
  // returns from cached raw prices, which has bitten us with forward-fill bugs in the past.
  const lastWorkerInputsRef = useRef<{
    tickersKey: string;
    assetsHistoryForWorker: AssetHistory[];
  } | null>(null);

  // Main task to load all price data and backtest
  const loadDataAndBacktest = useCallback(async (forceFetch = false) => {
    if (assets.length === 0) {
      setHistoricalMetrics(null);
      return;
    }

    // Decide whether the user needs to see a loading screen for a network fetch
    let needsNetworkFetch = forceFetch;
    const cachedBench = benchmarkHistoryCacheRef.current;
    if (!cachedBench || cachedBench.ticker !== benchmarkTicker) {
      needsNetworkFetch = true;
    }
    if (!needsNetworkFetch) {
      for (const asset of assets) {
        if (!assetsHistoriesCacheRef.current[asset.ticker]) {
          needsNetworkFetch = true;
          break;
        }
      }
    }

    if (needsNetworkFetch) {
      setHistoricalLoading(true);
    }
    setHistoricalError(null);
    setDataWarning(null);

    try {
      // 1. Fetch / resolve histories for every asset
      const updatedCache = { ...assetsHistoriesCacheRef.current };
      const historiesToAlign: { ticker: string; prices: HistoricalPrice[] }[] = [];

      for (const asset of assets) {
        let prices = updatedCache[asset.ticker];
        if (!prices || forceFetch) {
          prices = await fetchHistoricalData(asset.ticker, '10y');
          updatedCache[asset.ticker] = prices;
        }
        historiesToAlign.push({ ticker: asset.ticker, prices });
      }
      assetsHistoriesCacheRef.current = updatedCache;

      // 2. Fetch / resolve benchmark history
      let benchmarkPrices: HistoricalPrice[] = [];
      if (cachedBench && cachedBench.ticker === benchmarkTicker && !forceFetch) {
        benchmarkPrices = cachedBench.prices;
      } else {
        benchmarkPrices = await fetchHistoricalData(benchmarkTicker, '10y');
        benchmarkHistoryCacheRef.current = { ticker: benchmarkTicker, prices: benchmarkPrices };
      }

      // 3. Align portfolio assets historical data (weekday union, forward-filled per asset)
      const { dates, alignedPrices } = alignHistoricalData(historiesToAlign);
      if (dates.length < 30) {
        throw new Error('Not enough overlapping trading days to align historical data. Please verify your assets traded concurrently.');
      }

      // 4. Align the benchmark to the same date axis.
      // Skip dates before the benchmark's own inception so the benchmark series isn't
      // back-filled with its first price (which would distort CAGR / vol / alpha / beta).
      // We forward-fill missing benchmark days within the benchmark's coverage window.
      const benchMap = new Map<string, number>();
      benchmarkPrices.forEach(p => benchMap.set(p.date, p.price));

      const finalDates: string[] = [];
      const finalAlignedPrices: { [ticker: string]: number | null }[] = [];
      const finalBenchmarkPrices: number[] = [];

      let lastKnownBenchPrice: number | undefined = undefined;
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const direct = benchMap.get(date);
        if (direct !== undefined) {
          lastKnownBenchPrice = direct;
        }
        if (lastKnownBenchPrice === undefined) {
          // Pre-benchmark-inception: drop the row entirely instead of seeding with a stale price
          continue;
        }
        finalDates.push(date);
        finalAlignedPrices.push(alignedPrices[i]);
        finalBenchmarkPrices.push(lastKnownBenchPrice);
      }

      if (finalDates.length < 30) {
        throw new Error('Not enough overlapping trading days between portfolio assets and benchmark.');
      }

      // 5. Slice client-side based on the requested historicalRange
      let slicedDates = finalDates;
      let slicedAlignedPrices = finalAlignedPrices;
      let slicedBenchmarkPrices = finalBenchmarkPrices;

      const rangeYearsMap: { [key: string]: number } = { '1y': 1, '3y': 3, '5y': 5, '10y': 10 };
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

      // Find the first index where ALL assets have a real (post-inception) price.
      // The historical chart still spans the full slice (with dynamic weighting before this
      // index), but the Monte Carlo simulation runs only on the overlap window.
      let firstValidIndex = 0;
      for (let i = 0; i < slicedAlignedPrices.length; i++) {
        const row = slicedAlignedPrices[i];
        const allNonNull = assets.every(asset => row[asset.ticker] !== null);
        if (allNonNull) {
          firstValidIndex = i;
          break;
        }
      }

      const mcDates = slicedDates.slice(firstValidIndex);
      const mcAlignedPrices = slicedAlignedPrices.slice(firstValidIndex);

      // Surface a "Dynamic Weighting" notice when at least one asset's inception falls
      // inside the requested window
      let warning: string | null = null;
      if (firstValidIndex > 0 && slicedDates.length > 0) {
        const mcStartDate = new Date(mcDates[0]);
        const mcEndDate = new Date(mcDates[mcDates.length - 1]);
        const actualOverlapYears = ((mcEndDate.getTime() - mcStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);

        const missingAssetsDetails: string[] = [];
        assets.forEach(asset => {
          let firstNonNullIdx = -1;
          for (let i = 0; i < slicedAlignedPrices.length; i++) {
            if (slicedAlignedPrices[i][asset.ticker] !== null) {
              firstNonNullIdx = i;
              break;
            }
          }
          if (firstNonNullIdx > 0) {
            const startDateStr = slicedDates[firstNonNullIdx];
            const startDate = new Date(startDateStr);
            const formattedDate = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            missingAssetsDetails.push(`${asset.ticker} (inception ${formattedDate})`);
          }
        });

        const assetsListStr = missingAssetsDetails.join(', ');
        warning = `Some assets have shorter histories than the requested range: ${assetsListStr}. The historical backtest dynamically redistributes their weight to available assets prior to their inception. The Monte Carlo simulation uses the overlapping ${actualOverlapYears} years of data.`;
      }

      // 6. Compile historical portfolio vs benchmark metrics
      const weightsMap: { [ticker: string]: number } = {};
      assets.forEach(a => { weightsMap[a.ticker] = a.weight; });

      const metrics = compileHistoricalMetrics(
        slicedDates,
        slicedAlignedPrices,
        weightsMap,
        slicedBenchmarkPrices
      );

      setHistoricalMetrics(metrics);
      setHistoricalLoading(false);
      setDataWarning(warning);

      // 7. Trigger Monte Carlo simulation on the overlap window
      if (isAllocationValid && mcDates.length >= 30) {
        const assetsHistoriesForWorker = buildAssetHistories(assets, mcDates, mcAlignedPrices);

        lastWorkerInputsRef.current = {
          tickersKey: tickersKey(assets),
          assetsHistoryForWorker: assetsHistoriesForWorker,
        };

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

  // Quick rerun: replay MC with the cached per-asset histories from the last full backtest.
  // The cached histories don't depend on weights or sim parameters — only the asset list and
  // the data window — so we can re-trigger the worker for free as long as the ticker set matches.
  const handleQuickRunSimulation = useCallback(() => {
    if (!isAllocationValid || !historicalMetrics) return;

    const cached = lastWorkerInputsRef.current;
    if (!cached || cached.tickersKey !== tickersKey(assets)) {
      // Cache is stale (ticker set changed). The debounced effect will run a full backtest.
      return;
    }

    runMonteCarlo({
      assets,
      assetsHistory: cached.assetsHistoryForWorker,
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
    setDataWarning(null);
    assetsHistoriesCacheRef.current = {};
    benchmarkHistoryCacheRef.current = null;
    lastWorkerInputsRef.current = null;
  }, [cancelSimulation]);

  return {
    historicalMetrics,
    historicalLoading,
    historicalError,
    dataWarning,
    simLoading,
    simError,
    simResult,
    isAllocationValid,
    loadDataAndBacktest,
    handleQuickRunSimulation,
    handleResetCaches,
  };
}

// --- helpers ---

const TRADING_DAYS_PER_YEAR = 252;

function tickersKey(assets: Asset[]): string {
  return assets.map(a => a.ticker).sort().join('|');
}

/**
 * Build per-asset MC inputs (returns, annualized CAGR, annualized volatility) from an
 * already aligned and overlap-windowed price grid. Inputs are guaranteed non-null because
 * the caller slices to the first index where every asset has post-inception data.
 */
function buildAssetHistories(
  assets: Asset[],
  mcDates: string[],
  mcAlignedPrices: { [ticker: string]: number | null }[]
): AssetHistory[] {
  return assets.map(asset => {
    const alignedAssetPrices = mcAlignedPrices.map(row => row[asset.ticker] as number);

    const returns: number[] = [];
    for (let t = 1; t < alignedAssetPrices.length; t++) {
      returns.push((alignedAssetPrices[t] - alignedAssetPrices[t - 1]) / alignedAssetPrices[t - 1]);
    }

    const years = mcDates.length / TRADING_DAYS_PER_YEAR;
    const cagrRaw = years > 0
      ? Math.pow(alignedAssetPrices[alignedAssetPrices.length - 1] / alignedAssetPrices[0], 1 / years) - 1
      : 0;

    let volatilityRaw = 0;
    if (returns.length > 1) {
      const meanRet = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanRet, 2), 0) / (returns.length - 1);
      volatilityRaw = Math.sqrt(variance) * Math.sqrt(TRADING_DAYS_PER_YEAR);
    }

    return {
      ticker: asset.ticker,
      prices: mcDates.map((d, idx) => ({ date: d, price: alignedAssetPrices[idx] })),
      returns,
      cagr: isNaN(cagrRaw) ? 0 : cagrRaw,
      volatility: isNaN(volatilityRaw) ? 0 : volatilityRaw,
    };
  });
}
