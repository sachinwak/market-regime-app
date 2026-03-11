'use client';

import { useState, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import GlobalSentiment from '@/components/GlobalSentiment';
import AsianMarkets from '@/components/AsianMarkets';
import CurrencyFlow from '@/components/CurrencyFlow';
import FiiDiiFlow from '@/components/FiiDiiFlow';
import VixWidget from '@/components/VixWidget';
import OptionChain from '@/components/OptionChain';
import PreMarketStructure from '@/components/PreMarketStructure';
import RegimeDecision from '@/components/RegimeDecision';
import DailyChecklist from '@/components/DailyChecklist';
import { Signal } from '@/types/market';

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const signalMap = useRef<Record<string, Signal[]>>({});

  const mergeSignals = useCallback((group: string, newSignals: Signal[]) => {
    signalMap.current[group] = newSignals;
    const all = Object.values(signalMap.current).flat();
    setSignals(all);
    setLastUpdated(new Date());
  }, []);

  const handleSingleSignal = useCallback((group: string, signal: Signal) => {
    mergeSignals(group, [signal]);
  }, [mergeSignals]);

  const handleRefresh = () => {
    signalMap.current = {};
    setSignals([]);
    setRefreshKey(k => k + 1);
  };

  return (
    <main className="min-h-screen bg-[#080b14] text-white">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-emerald-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <Header onRefresh={handleRefresh} lastUpdated={lastUpdated} />

        {/* Regime Decision — pinned at top as the most important output */}
        <div className="mb-6">
          <RegimeDecision signals={signals} />
        </div>

        {/* Steps grid */}
        <div className="space-y-4" key={refreshKey}>
          {/* Step 1: Global Risk Sentiment — full width */}
          <GlobalSentiment
            onSignals={(s) => mergeSignals('global', s)}
          />

          {/* Step 2 + 3 side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AsianMarkets onSignals={(s) => mergeSignals('asian', s)} />
            <CurrencyFlow onSignal={(s) => handleSingleSignal('currency', s)} />
          </div>

          {/* Step 4 + 5 side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FiiDiiFlow onSignal={(s) => handleSingleSignal('fiidii', s)} />
            <VixWidget onSignal={(s) => handleSingleSignal('vix', s)} />
          </div>

          {/* Step 6 + 7 side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OptionChain onSignal={(s) => handleSingleSignal('optionchain', s)} />
            <PreMarketStructure onSignal={(s) => handleSingleSignal('premarket', s)} />
          </div>

          {/* Daily Checklist — full width */}
          <DailyChecklist />
        </div>

        <footer className="mt-8 text-center text-xs text-slate-600 space-y-1">
          <p>Market Regime Detector • Free APIs only • Data for informational purposes only</p>
          <p>Data sources: Yahoo Finance, NSE India • Refresh manually before market open (9:00–9:15 AM IST)</p>
        </footer>
      </div>
    </main>
  );
}
