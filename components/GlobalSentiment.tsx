'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe, AlertCircle } from 'lucide-react';
import MarketCard from './MarketCard';
import { MarketQuote, Signal } from '@/types/market';

interface Props {
    onSignals: (signals: Signal[]) => void;
}

import { fetchYahooData } from '@/lib/api-client';

const GLOBAL_INSTRUMENTS = [
    { symbol: '^GSPC', label: 'S&P 500', description: 'US Market Sentiment', invertSignal: false },
    { symbol: 'DX-Y.NYB', label: 'Dollar Index (DXY)', description: 'USD Strength', invertSignal: true },
    { symbol: '^TNX', label: 'US 10Y Bond Yield', description: 'Cost of Money', invertSignal: true },
    { symbol: 'GC=F', label: 'Gold Futures', description: 'Fear Gauge', invertSignal: true },
    { symbol: 'BZ=F', label: 'Brent Crude Oil', description: 'Inflation Signal', invertSignal: false },
];

export default function GlobalSentiment({ onSignals }: Props) {
    const [quotes, setQuotes] = useState<(MarketQuote | null)[]>([]);
    const [loading, setLoading] = useState(true);
    const [riskMode, setRiskMode] = useState<'ON' | 'OFF' | 'NEUTRAL'>('NEUTRAL');

    const onSignalsRef = useRef(onSignals);
    onSignalsRef.current = onSignals;

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const results = await Promise.all(
                GLOBAL_INSTRUMENTS.map(async (inst) => {
                    try {
                        const data = await fetchYahooData(inst.symbol);
                        return data as MarketQuote | null;
                    } catch (e) { return null; }
                })
            );
            setQuotes(results);
            setLoading(false);

            // Compute risk mode & signals
            const signals: Signal[] = results.map((q, i) => {
                const inst = GLOBAL_INSTRUMENTS[i];
                if (!q) return { name: inst.label, direction: 'neutral' as const, strength: 0, description: 'Data unavailable' };
                const isUp = q.changePercent > 0.1;
                const isDown = q.changePercent < -0.1;
                // For DXY, bond yield, gold: up = bearish for market
                const strength = inst.invertSignal
                    ? (isUp ? -1 : isDown ? 1 : 0)
                    : (isUp ? 1 : isDown ? -1 : 0);
                return {
                    name: inst.label,
                    direction: q.changePercent > 0 ? 'up' : q.changePercent < 0 ? 'down' : 'neutral',
                    strength,
                    description: `${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%`,
                };
            });
            onSignalsRef.current(signals);

            const bullSignals = signals.filter(s => s.strength > 0).length;
            const bearSignals = signals.filter(s => s.strength < 0).length;
            if (bullSignals >= 3) setRiskMode('ON');
            else if (bearSignals >= 3) setRiskMode('OFF');
            else setRiskMode('NEUTRAL');
        };
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const riskClass = riskMode === 'ON' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30'
        : riskMode === 'OFF' ? 'text-red-400 bg-red-400/10 border-red-500/30'
            : 'text-amber-400 bg-amber-400/10 border-amber-500/30';

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Globe size={18} className="text-blue-400" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Step 1 — Global Risk Sentiment</h2>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${riskClass}`}>
                    RISK {riskMode}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {GLOBAL_INSTRUMENTS.map((inst, i) => (
                    <MarketCard
                        key={inst.symbol}
                        quote={quotes[i] ?? null}
                        label={inst.label}
                        description={inst.description}
                        loading={loading}
                        invertSignal={inst.invertSignal}
                    />
                ))}
            </div>

            <div className="mt-3 flex gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><AlertCircle size={10} /> Risk ON: S&P↑, DXY↓, Bond stable, Gold stable</span>
                <span className="flex items-center gap-1">Risk OFF: S&P↓, DXY↑, Gold↑, Bond↑</span>
            </div>
        </section>
    );
}
