import { useState, useEffect } from 'react';
import type { Asset, HistoricalPrice, HistoricalRange } from '@/types';
import { PRESET_ASSETS } from '@/services/dataService';

export function usePortfolioState() {
  const [rememberSelection, setRememberSelection] = useState<boolean>(() => {
    return localStorage.getItem('portfolio_remember') === 'true';
  });

  const [assets, setAssets] = useState<Asset[]>(() => {
    if (localStorage.getItem('portfolio_remember') === 'true') {
      const saved = localStorage.getItem('portfolio_assets');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {
          console.error('Failed to parse saved assets', e);
        }
      }
    }
    return PRESET_ASSETS;
  });

  // Save to local storage whenever assets or toggle changes
  useEffect(() => {
    if (rememberSelection) {
      localStorage.setItem('portfolio_assets', JSON.stringify(assets));
      localStorage.setItem('portfolio_remember', 'true');
    } else {
      localStorage.removeItem('portfolio_assets');
      localStorage.setItem('portfolio_remember', 'false');
    }
  }, [assets, rememberSelection]);

  const [initialInvestment, setInitialInvestment] = useState<number>(10000);
  const [horizonYears, setHorizonYears] = useState<number>(10);
  const [simulationsCount, setSimulationsCount] = useState<number>(5000);
  const [model, setModel] = useState<'gbm' | 'bootstrap'>('gbm');
  const [rebalanceFrequency, setRebalanceFrequency] = useState<'none' | 'monthly' | 'annually' | 'threshold'>('none');
  const [benchmarkTicker, setBenchmarkTicker] = useState<string>('SPY');
  const [historicalRange, setHistoricalRange] = useState<HistoricalRange>('5y');

  // Advanced Realism & Frictions States
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState<number>(0);
  const [adjustInflation, setAdjustInflation] = useState<boolean>(false);
  const [annualInflationRate, setAnnualInflationRate] = useState<number>(0.03);
  const [isTaxable, setIsTaxable] = useState<boolean>(false);
  const [capitalGainsTaxRate, setCapitalGainsTaxRate] = useState<number>(0.15);
  const [transactionFeeRate, setTransactionFeeRate] = useState<number>(0.001); // 0.1% default
  const [rebalanceThreshold, setRebalanceThreshold] = useState<number>(5); // 5% default
  const [bootstrapBlockSize, setBootstrapBlockSize] = useState<number>(10); // 10 days default
  const [useGarch, setUseGarch] = useState<boolean>(false);
  const [useMertonJumps, setUseMertonJumps] = useState<boolean>(false);

  // Custom uploaded CSVs: ticker -> array of { date, price }
  const [customCsvPrices, setCustomCsvPrices] = useState<{ [ticker: string]: HistoricalPrice[] }>({});
  const [customCsvUploaded, setCustomCsvUploaded] = useState<{ [ticker: string]: string }>({});

  // Upload handler for CSV
  const handleUploadCSV = (ticker: string, name: string, prices: HistoricalPrice[]) => {
    setCustomCsvPrices(prev => ({ ...prev, [ticker]: prices }));
    setCustomCsvUploaded(prev => ({ ...prev, [ticker]: name }));
  };

  const handleReset = () => {
    setAssets(PRESET_ASSETS);
    setInitialInvestment(10000);
    setHorizonYears(10);
    setSimulationsCount(5000);
    setModel('gbm');
    setRebalanceFrequency('none');
    setBenchmarkTicker('SPY');
    setHistoricalRange('5y');
    setMonthlyContribution(0);
    setMonthlyWithdrawal(0);
    setAdjustInflation(false);
    setAnnualInflationRate(0.03);
    setIsTaxable(false);
    setCapitalGainsTaxRate(0.15);
    setTransactionFeeRate(0.001);
    setRebalanceThreshold(5);
    setBootstrapBlockSize(10);
    setUseGarch(false);
    setUseMertonJumps(false);
    setCustomCsvPrices({});
    setCustomCsvUploaded({});
  };

  return {
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
    customCsvPrices,
    customCsvUploaded,
    handleUploadCSV,
    handleReset,
  };
}
