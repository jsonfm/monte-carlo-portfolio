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
  const [rebalanceFrequency, setRebalanceFrequency] = useState<'none' | 'monthly' | 'annually'>('none');
  const [benchmarkTicker, setBenchmarkTicker] = useState<string>('SPY');
  const [historicalRange, setHistoricalRange] = useState<HistoricalRange>('5y');

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
    customCsvPrices,
    customCsvUploaded,
    handleUploadCSV,
    handleReset,
  };
}
