'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MarketQuote, Signal } from '@/types/market';

interface Props {
    onSignal: (signal: Signal) => void;
}

export default function PreMarketStructure({ onSignal }: Props) {
    const [nifty, setNifty] = useState<MarketQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const onSignalRef = useRef(onSignal);
    onSignalRef.current = onSignal;

    useEffect(() => {
        const fetch_ = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/yahoo?symbol=%5ENSEI');
                if (res.ok) {
                    const data: MarketQuote = await res.json();
                    setNifty(data);
                    const isGapUp = data.changePercent > 0.5;
                    const isGapDown = data.changePercent < -0.5;
                    onSignalRef.current({
                        name: 'Pre-Market Structure',
                        direction: isGapUp ? 'up' : isGapDown ? 'down' : 'neutral',
                        strength: isGapUp ? 1 : isGapDown ? -1 : 0,
                        description: `Nifty: ${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}%`,
                    });
                }
            } catch { /* silent */ }
            setLoading(false);
        };
        fetch_();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const gapType = nifty
        ? (nifty.changePercent > 0.5 ? 'gap-up' : nifty.changePercent < -0.5 ? 'gap-down' : 'flat')
        : null;

    const gapInfo = {
        'gap-up': { icon: <TrendingUp size={20} />, color: 'text-emerald-400', bg: 'from-emerald-500/10 border-emerald-500/20', label: 'Gap Up Open' },
        'gap-down': { icon: <TrendingDown size={20} />, color: 'text-red-400', bg: 'from-red-500/10 border-red-500/20', label: 'Gap Down Open' },
        'flat': { icon: <Minus size={20} />, color: 'text-amber-400', bg: 'from-amber-500/10 border-amber-500/20', label: 'Flat Open' },
    };

    const g = gapType ? gapInfo[gapType] : null;

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-rose-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Step 7 — Pre-Market Structure</h2>
            </div>

            {loading ? (
                <div className="animate-pulse h-28 bg-slate-800 rounded-xl" />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={`rounded-xl p-4 border bg-gradient-to-br ${g?.bg ?? 'border-slate-700'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={g?.color}>{g?.icon}</span>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Nifty 50 Gap Analysis</p>
                        </div>
                        <p className={`text-2xl font-black ${g?.color}`}>{g?.label}</p>
                        <p className={`text-sm font-semibold mt-1 ${g?.color}`}>
                            {nifty ? `${nifty.changePercent >= 0 ? '+' : ''}${nifty.changePercent.toFixed(2)}%` : '—'}
                        </p>
                        {nifty && (
                            <p className="text-xs text-slate-500 mt-1">
                                Prev Close: {nifty.previousClose.toLocaleString('en-IN', { maximumFractionDigits: 0 })} →
                                Now: {nifty.price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </p>
                        )}
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Gap Interpretation</p>
                        <div className="space-y-1 text-xs">
                            <p className="text-slate-300">🟢 <span className="text-slate-400">Gap + Global confirmation</span> → Trend day</p>
                            <p className="text-slate-300">🔴 <span className="text-slate-400">Gap opposite to global</span> → Trap day</p>
                            <p className="text-slate-300">🟡 <span className="text-slate-400">Flat open + Mixed signals</span> → Range day</p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
