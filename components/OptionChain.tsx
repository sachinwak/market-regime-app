'use client';

import { useEffect, useRef, useState } from 'react';
import { Layers, ExternalLink } from 'lucide-react';
import { Signal } from '@/types/market';

interface Props {
    onSignal: (signal: Signal) => void;
}

interface PcrData { pcr: number | null; callOi: number | null; putOi: number | null; }

function formatOi(oi: number | null) {
    if (oi === null) return '—';
    if (oi >= 10000000) return `${(oi / 10000000).toFixed(1)}Cr`;
    if (oi >= 100000) return `${(oi / 100000).toFixed(1)}L`;
    return oi.toLocaleString();
}

export default function OptionChain({ onSignal }: Props) {
    const [data, setData] = useState<PcrData | null>(null);
    const [loading, setLoading] = useState(true);
    const onSignalRef = useRef(onSignal);
    onSignalRef.current = onSignal;

    useEffect(() => {
        const fetch_ = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/nse?type=pcr');
                if (res.ok) {
                    const d: PcrData = await res.json();
                    setData(d);
                    if (d.pcr !== null) {
                        onSignalRef.current({
                            name: 'Option PCR',
                            direction: d.pcr > 1.2 ? 'up' : d.pcr < 0.8 ? 'down' : 'neutral',
                            strength: d.pcr > 1.2 ? 1 : d.pcr < 0.8 ? -1 : 0,
                            description: `PCR: ${d.pcr.toFixed(2)} — ${d.pcr > 1.2 ? 'Bullish bias' : d.pcr < 0.8 ? 'Bearish bias' : 'Neutral'}`,
                        });
                    } else {
                        onSignalRef.current({ name: 'Option PCR', direction: 'neutral', strength: 0, description: 'Check manually' });
                    }
                }
            } catch { /* silent */ }
            setLoading(false);
        };
        fetch_();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pcrStatus = data?.pcr !== null && data?.pcr !== undefined
        ? (data.pcr > 1.5 ? { color: 'text-emerald-400', label: 'Extremely Bullish — Puts Dominate' }
            : data.pcr > 1.2 ? { color: 'text-green-400', label: 'Bullish Bias' }
                : data.pcr > 0.8 ? { color: 'text-amber-400', label: 'Neutral / Range Bound' }
                    : { color: 'text-red-400', label: 'Bearish Bias — Calls Dominate' })
        : null;

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <Layers size={18} className="text-indigo-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Step 6 — Option Chain Liquidity</h2>
            </div>

            {loading ? (
                <div className="animate-pulse grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}
                </div>
            ) : (data?.pcr === null) ? (
                <div className="space-y-3">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-amber-400 text-sm font-medium mb-2">⚠️ Option chain data requires manual check</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {[
                                { label: 'Sensibull', url: 'https://web.sensibull.com/optionchain?expiry=latest&tradingsymbol=NIFTY' },
                                { label: 'Opstra', url: 'https://opstra.definedge.com/' },
                                { label: 'NSE Option Chain', url: 'https://www.nseindia.com/option-chain' },
                            ].map(link => (
                                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-lg transition-colors">
                                    <ExternalLink size={10} /> {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-800/50 rounded-xl p-3">
                            <p className="text-red-400 font-semibold mb-1">Huge Call OI above price</p>
                            <p className="text-slate-400">→ Strong resistance above</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3">
                            <p className="text-emerald-400 font-semibold mb-1">Huge Put OI below price</p>
                            <p className="text-slate-400">→ Strong support below</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                            <p className="text-xs text-slate-400 mb-1">Total Call OI</p>
                            <p className="text-lg font-bold text-red-400">{formatOi(data?.callOi ?? null)}</p>
                            <p className="text-xs text-slate-500">Resistance</p>
                        </div>
                        <div className={`rounded-xl p-4 text-center border ${pcrStatus?.color === 'text-emerald-400' ? 'bg-emerald-500/10 border-emerald-500/20' : pcrStatus?.color === 'text-red-400' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                            <p className="text-xs text-slate-400 mb-1">PCR</p>
                            <p className={`text-2xl font-black ${pcrStatus?.color}`}>{data?.pcr?.toFixed(2)}</p>
                            <p className={`text-xs ${pcrStatus?.color}`}>{pcrStatus?.label}</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                            <p className="text-xs text-slate-400 mb-1">Total Put OI</p>
                            <p className="text-lg font-bold text-emerald-400">{formatOi(data?.putOi ?? null)}</p>
                            <p className="text-xs text-slate-500">Support</p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500">PCR &gt; 1.2 = bullish | PCR 0.8-1.2 = range | PCR &lt; 0.8 = bearish</p>
                </div>
            )}
        </section>
    );
}
