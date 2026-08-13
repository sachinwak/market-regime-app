'use client';

import { useEffect, useRef, useState } from 'react';
import { Map } from 'lucide-react';
import MarketCard from './MarketCard';
import { MarketQuote, Signal } from '@/types/market';

interface Props {
    onSignals: (signals: Signal[]) => void;
}

import { fetchYahooData } from '@/lib/api-client';

const ASIAN_MARKETS = [
    { symbol: '^N225', label: 'Nikkei 225', description: 'Japan' },
    { symbol: '^HSI', label: 'Hang Seng', description: 'Hong Kong' },
    { symbol: '^NSEI', label: 'Nifty 50 Prev', description: 'SGX Proxy' },
];

export default function AsianMarkets({ onSignals }: Props) {
    const [quotes, setQuotes] = useState<(MarketQuote | null)[]>([]);
    const [loading, setLoading] = useState(true);
    const [alignment, setAlignment] = useState<string>('—');

    const onSignalsRef = useRef(onSignals);
    onSignalsRef.current = onSignals;

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const results = await Promise.all(
                ASIAN_MARKETS.map(async (inst) => {
                    try {
                        const data = await fetchYahooData(inst.symbol);
                        return data as MarketQuote | null;
                    } catch (e) { return null; }
                })
            );
            setQuotes(results);
            setLoading(false);

            const valid = results.filter(Boolean);
            const up = valid.filter(q => q && q.changePercent > 0).length;
            const down = valid.filter(q => q && q.changePercent < 0).length;
            const total = valid.length;

            const signals: Signal[] = results.map((q, i) => ({
                name: ASIAN_MARKETS[i].label,
                direction: q ? (q.changePercent > 0 ? 'up' : q.changePercent < 0 ? 'down' : 'neutral') : 'neutral',
                strength: q ? (q.changePercent > 0 ? 1 : q.changePercent < 0 ? -1 : 0) : 0,
                description: q ? `${q.changePercent.toFixed(2)}%` : 'N/A',
            }));
            onSignalsRef.current(signals);

            if (up === total) setAlignment('All ↑ — Strong Trend Signal');
            else if (down === total) setAlignment('All ↓ — Strong Downtrend Signal');
            else setAlignment('Mixed — Range Likely');
        };
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const alignColor = alignment.includes('Strong') ? 'text-emerald-400' :
        alignment.includes('Downtrend') ? 'text-red-400' : 'text-amber-400';

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Map size={18} className="text-purple-400" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Step 2 — Asian Markets</h2>
                </div>
                <span className={`text-xs font-medium ${alignColor}`}>{alignment}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ASIAN_MARKETS.map((inst, i) => (
                    <MarketCard key={inst.symbol} quote={quotes[i] ?? null} label={inst.label} description={inst.description} loading={loading} />
                ))}
            </div>
            <div className="mt-3 text-xs text-slate-500">All markets same direction → strong trend | Mixed → range likely</div>
        </section>
    );
}
