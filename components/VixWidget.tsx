'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';
import { Signal } from '@/types/market';

interface Props {
    onSignal: (signal: Signal) => void;
}

export default function VixWidget({ onSignal }: Props) {
    const [vix, setVix] = useState<number | null>(null);
    const [change, setChange] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const onSignalRef = useRef(onSignal);
    onSignalRef.current = onSignal;

    useEffect(() => {
        const fetch_ = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/nse?type=vix');
                if (res.ok) {
                    const data = await res.json();
                    setVix(data.vix);
                    setChange(data.change ?? 0);
                    const level = data.vix ?? 0;
                    onSignalRef.current({
                        name: 'India VIX',
                        direction: level < 15 ? 'up' : level > 20 ? 'down' : 'neutral',
                        strength: level < 15 ? 1 : level > 20 ? -1 : 0,
                        description: `VIX: ${level.toFixed(2)} — ${level < 15 ? 'low (stable)' : level > 20 ? 'high (trap risk)' : 'moderate'}`,
                    });
                }
            } catch { /* silent */ }
            setLoading(false);
        };
        fetch_();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getVixStatus = (v: number) => {
        if (v < 13) return { label: 'Very Low — Complacency', color: 'text-emerald-400', bg: 'from-emerald-500/20 to-emerald-900/5 border-emerald-500/30' };
        if (v < 18) return { label: 'Low — Stable Trend Possible', color: 'text-green-400', bg: 'from-green-500/20 to-green-900/5 border-green-500/30' };
        if (v < 22) return { label: 'Moderate — Caution', color: 'text-amber-400', bg: 'from-amber-500/20 to-amber-900/5 border-amber-500/30' };
        if (v < 28) return { label: 'High — Fake Moves Likely', color: 'text-orange-400', bg: 'from-orange-500/20 to-orange-900/5 border-orange-500/30' };
        return { label: 'Very High — Trap Day', color: 'text-red-400', bg: 'from-red-500/20 to-red-900/5 border-red-500/30' };
    };

    const status = vix !== null ? getVixStatus(vix) : null;
    const pct = vix !== null ? Math.min((vix / 40) * 100, 100) : 0;

    const segments = [
        { label: '<13', color: 'bg-emerald-500', maxPct: 32 },
        { label: '13-18', color: 'bg-green-500', maxPct: 45 },
        { label: '18-22', color: 'bg-amber-500', maxPct: 55 },
        { label: '22-28', color: 'bg-orange-500', maxPct: 70 },
        { label: '>28', color: 'bg-red-500', maxPct: 100 },
    ];

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-orange-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Step 5 — India VIX (Volatility)</h2>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-3">
                    <div className="h-20 bg-slate-800 rounded-xl" />
                    <div className="h-6 bg-slate-800 rounded-full" />
                </div>
            ) : (
                <div className={`rounded-xl p-4 border bg-gradient-to-r ${status?.bg ?? 'border-slate-700'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">India VIX</p>
                            <p className={`text-4xl font-black tabular-nums ${status?.color ?? 'text-white'}`}>
                                {vix !== null ? vix.toFixed(2) : '—'}
                            </p>
                            <p className={`text-xs mt-1 ${change >= 0 ? 'text-slate-400' : 'text-slate-400'}`}>
                                {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)} today
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-bold ${status?.color}`}>{status?.label}</p>
                            <p className="text-xs text-slate-500 mt-1">Fear Gauge</p>
                        </div>
                    </div>

                    {/* VIX bar */}
                    <div className="relative h-4 rounded-full overflow-hidden bg-slate-900/50 flex">
                        {segments.map((seg) => (
                            <div key={seg.label} className={`h-full ${seg.color} opacity-30`} style={{ width: `${seg.maxPct - (segments[segments.indexOf(seg) - 1]?.maxPct ?? 0)}%` }} />
                        ))}
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-[0_0_8px_white] transition-all duration-700"
                            style={{ left: `calc(${pct}% - 2px)` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>0</span><span>10</span><span>20</span><span>30</span><span>40+</span>
                    </div>
                </div>
            )}
        </section>
    );
}
