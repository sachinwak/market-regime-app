'use client';

import { useEffect, useRef, useState } from 'react';
import { DollarSign } from 'lucide-react';
import MarketCard from './MarketCard';
import { MarketQuote, Signal } from '@/types/market';

import { fetchYahooData } from '@/lib/api-client';

interface Props {
    onSignal: (signal: Signal) => void;
}

export default function CurrencyFlow({ onSignal }: Props) {
    const [quote, setQuote] = useState<MarketQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const onSignalRef = useRef(onSignal);
    onSignalRef.current = onSignal;

    useEffect(() => {
        const fetch_ = async () => {
            setLoading(true);
            try {
                const data = await fetchYahooData('USDINR=X');
                if (data) {
                    setQuote(data);
                    const signal: Signal = {
                        name: 'USD/INR',
                        direction: data.changePercent < 0 ? 'down' : data.changePercent > 0 ? 'up' : 'neutral',
                        strength: data.changePercent < -0.1 ? 1 : data.changePercent > 0.1 ? -1 : 0,
                        description: `${data.changePercent >= 0 ? '+' : ''}${data.changePercent.toFixed(2)}% — ${data.changePercent < 0 ? 'Rupee strengthening → FII buying' : 'Rupee weakening → FII pressure'}`,
                    };
                    onSignalRef.current(signal);
                }
            } catch (e) { /* silent */ }
            setLoading(false);
        };
        fetch_();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const interpretation = quote
        ? (quote.changePercent < -0.1 ? { text: '🟢 Rupee Strengthening — FII Buying → Bullish', color: 'text-emerald-400' }
            : quote.changePercent > 0.1 ? { text: '🔴 Rupee Weakening — FII Selling → Bearish Pressure', color: 'text-red-400' }
                : { text: '🟡 Rupee Stable — Neutral', color: 'text-amber-400' })
        : null;

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <DollarSign size={18} className="text-yellow-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Step 3 — Currency Flow</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MarketCard quote={quote} label="USD / INR" description="Foreign money flow indicator" loading={loading} invertSignal={true} />
                <div className="bg-slate-800/50 rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Interpretation</p>
                    {interpretation ? (
                        <p className={`text-sm font-semibold ${interpretation.color}`}>{interpretation.text}</p>
                    ) : (
                        <div className="h-4 bg-slate-700 rounded animate-pulse" />
                    )}
                    <p className="text-xs text-slate-500 mt-2">USDINR ↓ = FII buying = bullish market</p>
                    <p className="text-xs text-slate-500">USDINR ↑ = FII selling = bearish pressure</p>
                </div>
            </div>
        </section>
    );
}
