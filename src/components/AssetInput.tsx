import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Upload, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Search, Loader2 } from 'lucide-react';
import type { Asset, AssetType, HistoricalPrice } from '@/types';
import { getAssetColor } from '@/utils/colors';
import { parseCSVData, searchAssetsAPI } from '@/services/dataService';
import commonAssets from '@/data/commonAssets.json';

interface AssetInputProps {
  assets: Asset[];
  onChange: (assets: Asset[]) => void;
  onUploadCSV: (ticker: string, name: string, prices: HistoricalPrice[]) => void;
  customCsvUploaded: { [ticker: string]: string };
}

const SUGGESTED_ASSETS = [
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf' as AssetType },
  { ticker: 'QQQ', name: 'Invesco QQQ (Nasdaq 100)', type: 'etf' as AssetType },
  { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock' as AssetType },
  { ticker: 'BTC-USD', name: 'Bitcoin USD', type: 'crypto' as AssetType },
];

interface AssetItem {
  ticker: string;
  name: string;
  type: AssetType;
}

export function AssetInput({
  assets,
  onChange,
  onUploadCSV,
  customCsvUploaded,
}: AssetInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ticker: string, name: string, type: AssetType}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [csvTicker, setCsvTicker] = useState('CUSTOM1');
  const [csvName, setCsvName] = useState('My Custom Asset');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvSuccess, setCsvSuccess] = useState<string | null>(null);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAllocationOpen, setIsAllocationOpen] = useState(true);

  const searchRef = useRef<HTMLDivElement>(null);

  const totalWeight = assets.reduce((sum, a) => sum + a.weight, 0);

  const handleAddAsset = (newAsset: { ticker: string; name: string; type: AssetType; weight?: number }) => {
    if (assets.some(a => a.ticker.toUpperCase() === newAsset.ticker.toUpperCase())) {
      setError(`Asset with ticker ${newAsset.ticker} already exists`);
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }

    const remaining = Math.max(0, 100 - totalWeight);
    const weight = remaining > 0 ? Math.min(remaining, newAsset.weight || 10) : 0;

    onChange([...assets, { ...newAsset, weight }]);
    setError(null);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleRemoveAsset = (index: number) => {
    const updated = [...assets];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleWeightChange = (index: number, weightVal: string) => {
    const weight = parseFloat(weightVal) || 0;
    const updated = [...assets];
    updated[index].weight = Math.min(100, Math.max(0, weight));
    onChange(updated);
  };

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const prices = parseCSVData(text);
        
        const cleanTicker = csvTicker.trim().toUpperCase();
        if (assets.some(a => a.ticker === cleanTicker)) {
          throw new Error(`Ticker ${cleanTicker} is already in use`);
        }

        onUploadCSV(cleanTicker, csvName.trim(), prices);
        handleAddAsset({
          ticker: cleanTicker,
          name: csvName.trim(),
          type: 'stock',
          weight: 10,
        });

        setCsvSuccess(`Successfully loaded ${prices.length} days of historical data!`);
        setError(null);
        setCsvFile(null);
        const currentNum = parseInt(csvTicker.replace(/\D/g, '')) || 1;
        setCsvTicker(`CUSTOM${currentNum + 1}`);
        setIsCsvOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing CSV file');
        setCsvSuccess(null);
      }
    };
    reader.readAsText(csvFile);
  };

  const distributeEvenly = () => {
    if (assets.length === 0) return;
    const baseWeight = Math.floor(100 / assets.length);
    const remainder = 100 % assets.length;
    const updated = assets.map((asset, i) => ({
      ...asset,
      weight: baseWeight + (i < remainder ? 1 : 0),
    }));
    onChange(updated);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;

    if (!searchQuery.trim()) {
      const timer = setTimeout(() => {
        if (active) {
          setSearchResults([]);
          setShowDropdown(false);
        }
      }, 0);
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }

    const query = searchQuery.toLowerCase();
    
    const localMatches = (commonAssets as AssetItem[]).filter(a => 
      a.ticker.toLowerCase().includes(query) || 
      a.name.toLowerCase().includes(query)
    ).slice(0, 5);

    const syncTimer = setTimeout(() => {
      if (active) {
        setSearchResults(localMatches);
        setShowDropdown(true);
      }
    }, 0);

    const debounceTimer = setTimeout(async () => {
      if (active) {
        setIsSearching(true);
      }
      try {
        const apiResults = await searchAssetsAPI(searchQuery);
        if (!active) return;
        
        const merged = [...localMatches];
        for (const res of apiResults) {
          if (!merged.some(m => m.ticker === res.ticker)) {
            merged.push(res);
          }
        }
        setSearchResults(merged.slice(0, 8));
      } catch (err) {
        console.warn(err);
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(syncTimer);
      clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Simple Search Bar */}
      <div className="space-y-3 bg-slate-50 dark:bg-slate-900/40 p-4 border border-slate-200 dark:border-slate-800/80 rounded-xl transition-colors relative" ref={searchRef}>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
          <Search className="w-4 h-4 text-blue-500" /> Search & Add Assets
        </h3>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search by ticker or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchQuery.trim()) setShowDropdown(true); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (searchQuery.trim()) {
                  const exactMatch = searchResults.find(r => r.ticker.toLowerCase() === searchQuery.trim().toLowerCase());
                  if (exactMatch) {
                    handleAddAsset({ ...exactMatch, weight: 10 });
                  } else {
                    handleAddAsset({
                      ticker: searchQuery.trim().toUpperCase(),
                      name: `${searchQuery.trim().toUpperCase()} Asset`,
                      type: 'stock',
                      weight: 10,
                    });
                  }
                }
              }
            }}
            className="w-full text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2.5 px-4 pr-10 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          />
          {isSearching && (
            <div className="absolute right-3 top-2.5 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
              {searchResults.map((asset) => (
                <button
                  key={asset.ticker}
                  type="button"
                  onClick={() => handleAddAsset({ ...asset, weight: 10 })}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{asset.ticker}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{asset.name}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">
                    {asset.type}
                  </span>
                </button>
              ))}
            </div>
          )}
          
          {showDropdown && searchResults.length === 0 && !isSearching && searchQuery.trim() && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg px-4 py-3 text-sm text-slate-500 text-center">
              No assets found. You can press Enter to add anyway.
            </div>
          )}
        </div>
      </div>

      {/* Suggested Quick Adds */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl transition-colors overflow-hidden">
        <button 
          type="button" 
          onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
          className="w-full p-4 flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Quick Add Presets
          </div>
          {isQuickAddOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        
        {isQuickAddOpen && (
          <div className="p-4 pt-0">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_ASSETS.map((asset) => {
                const exists = assets.some(a => a.ticker === asset.ticker);
                return (
                  <button
                    key={asset.ticker}
                    type="button"
                    disabled={exists}
                    onClick={() => handleAddAsset({ ...asset, weight: 10 })}
                    className={`text-[11px] px-2 py-1 rounded-md border flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                      exists
                        ? 'border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <span className="font-bold">{asset.ticker}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[80px]">{asset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Portfolio Allocation (Moved here) */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl transition-colors overflow-hidden">
        <button 
          type="button" 
          onClick={() => setIsAllocationOpen(!isAllocationOpen)}
          className="w-full p-4 flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
            Portfolio Allocation
          </div>
          <div className="flex items-center gap-2">
            {assets.length > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                totalWeight === 100 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              }`}>
                {assets.length} {assets.length === 1 ? 'Asset' : 'Assets'} ({totalWeight}%)
              </span>
            )}
            {isAllocationOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>
        </button>

        {isAllocationOpen && (
          <div className="p-4 pt-0 space-y-3">
            {assets.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={distributeEvenly}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-wide bg-blue-100 dark:bg-blue-500/10 hover:bg-blue-200 dark:hover:bg-blue-500/20 px-2 py-1 rounded-md transition-colors cursor-pointer"
                >
                  Distribute Evenly
                </button>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {csvSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{csvSuccess}</span>
              </div>
            )}

            {assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/20 transition-colors">
                <AlertCircle className="w-5 h-5 text-slate-400 dark:text-slate-600 mb-2" />
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">No Assets Added</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-600 max-w-[200px]">Search ticker or use presets above to start building your portfolio.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {assets.map((asset, index) => {
                  const isCsv = !!customCsvUploaded[asset.ticker];
                  return (
                    <div
                      key={asset.ticker}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800/60 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50 shadow-sm"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: getAssetColor(index) }}
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-100 tracking-wide">{asset.ticker}</span>
                          <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                            {isCsv ? 'CSV' : asset.type}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]" title={asset.name}>
                          {asset.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          value={asset.weight}
                          onChange={(e) => handleWeightChange(index, e.target.value)}
                          className="w-16 text-center text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-1.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                          min="0"
                          max="100"
                          step="1"
                        />
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveAsset(index)}
                        className="text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Remove asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Weight Budget Monitor */}
            {assets.length > 0 && (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-colors shadow-sm ${
                totalWeight === 100
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {totalWeight === 100 ? 'Weights Allocated' : 'Allocation Required'}
                </span>
                <span>{totalWeight}% / 100%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collapsible CSV File Upload Option */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-xl transition-colors overflow-hidden">
        <button 
          type="button" 
          onClick={() => setIsCsvOpen(!isCsvOpen)}
          className="w-full p-4 flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-emerald-500" /> 
            Upload Private Historical CSV
          </div>
          {isCsvOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {isCsvOpen && (
          <form onSubmit={handleCsvUpload} className="p-4 pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Custom Ticker</label>
                <input
                  type="text"
                  value={csvTicker}
                  onChange={(e) => setCsvTicker(e.target.value.toUpperCase())}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Asset Name</label>
                <input
                  type="text"
                  value={csvName}
                  onChange={(e) => setCsvName(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
                CSV File (Must have "Date" and "Close" / "Adj Close" columns)
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 px-2 text-slate-600 dark:text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 file:cursor-pointer transition-colors shadow-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" /> Load CSV Asset
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
