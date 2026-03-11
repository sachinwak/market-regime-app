'use client';

import { useEffect, useRef, useState } from 'react';
import { Layers, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Signal } from '@/types/market';

interface Props {
    onSignal: (signal: Signal) => void;
}

interface OcData {
    pcr: number | null;
    atmStrike?: number | null;
    atmIv?: number | null;
    atmIvp?: string | null;
    maxPainStrike?: number | null;
    pcrType?: string | null;
    maxPainType?: string | null;
    activity?: string | null;
    activityDir?: string | null;
    futurePrice?: number | null;
    expiry?: string | null;
    source?: string;
    callOi: number | null;
    putOi: number | null;
}

export default function OptionChain({ onSignal }: Props) {
    const [data, setData] = useState<OcData | null>(null);
    const [loading, setLoading] = useState(true);
    const onSignalRef = useRef(onSignal);
    onSignalRef.current = onSignal;

    useEffect(() => {
        const fetch_ = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/nse?type=pcr');
                if (res.ok) {
                    const d: OcData = await res.json();
                    setData(d);
                    if (d.pcr !== null) {
                        onSignalRef.current({
                            name: 'Option PCR',
                            direction: d.pcr > 1.2 ? 'up' : d.pcr < 0.8 ? 'down' : 'neutral',
                            strength: d.pcr > 1.2 ? 1 : d.pcr < 0.8 ? -1 : 0,
                            description: `PCR: ${d.pcr.toFixed(2)} — ${d.pcrType ?? (d.pcr > 1.2 ? 'Bullish' : d.pcr < 0.8 ? 'Bearish' : 'Neutral')}`,
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

    const pcrStatus = data?.pcr != null
        ? data.pcr > 1.5 ? { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Extremely Bullish' }
            : data.pcr > 1.2 ? { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Bullish Bias' }
                : data.pcr > 0.8 ? { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Neutral / Range' }
                    : { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Bearish Bias' }
        : null;

    const activityColor = data?.activityDir === 'Bearish' ? 'text-red-400'
        : data?.activityDir === 'Bullish' ? 'text-emerald-400' : 'text-amber-400';

    const ActivityIcon = data?.activityDir === 'Bearish' ? TrendingDown
        : data?.activityDir === 'Bullish' ? TrendingUp : Minus;

    const hasData = data !== null && data.pcr !== null;

    const LINKS = [
        { label: 'Sensibull', url: `https://web.sensibull.com/option-chain?tradingsymbol=NIFTY&view=ltp${data?.expiry ? `&expiry=${data.expiry}` : ''}` },
        { label: 'NSE', url: 'https://www.nseindia.com/option-chain' },
        { label: 'Opstra', url: 'https://opstra.definedge.com/' },
    ];

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Layers size={18} className="text-indigo-400" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Step 6 — Option Chain Liquidity</h2>
                </div>
                <div className="flex items-center gap-2">
                    {data?.expiry && <span className="text-xs text-slate-500">Expiry: <span className="text-slate-400">{data.expiry}</span></span>}
                    <a href={LINKS[0].url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        <ExternalLink size={11} /> Sensibull
                    </a>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-3">
                    <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800 rounded-xl" />)}</div>
                    <div className="h-10 bg-slate-800 rounded-xl" />
                </div>

            ) : !hasData ? (
                <div className="space-y-3">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-amber-400 text-sm font-medium mb-2">⚠️ Data unavailable — check manually</p>
                        <div className="flex flex-wrap gap-2">
                            {LINKS.map(link => (
                                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-lg transition-colors">
                                    <ExternalLink size={10} /> {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-red-500/10 rounded-xl p-3 text-center"><p className="text-red-400 font-semibold">Max Call OI</p><p className="text-slate-500 mt-0.5">→ Resistance</p></div>
                        <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-amber-400 font-semibold">PCR</p><p className="text-slate-500 mt-0.5">&gt;1.2 bullish</p></div>
                        <div className="bg-emerald-500/10 rounded-xl p-3 text-center"><p className="text-emerald-400 font-semibold">Max Put OI</p><p className="text-slate-500 mt-0.5">→ Support</p></div>
                    </div>
                </div>

            ) : (
                <div className="space-y-3">

                    {/* Row 1: PCR + ATM Strike + ATM IV */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className={`rounded-xl p-4 border ${pcrStatus?.bg}`}>
                            <p className="text-xs text-slate-400 mb-1">PCR</p>
                            <p className={`text-3xl font-black tabular-nums ${pcrStatus?.color}`}>{data.pcr?.toFixed(2)}</p>
                            <p className={`text-xs font-medium mt-0.5 ${pcrStatus?.color}`}>{data.pcrType ?? pcrStatus?.label}</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
                            <p className="text-xs text-slate-400 mb-1">ATM Strike</p>
                            <p className="text-2xl font-bold text-white tabular-nums">{data.atmStrike ?? '—'}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Future: {data.futurePrice?.toFixed(0) ?? '—'}</p>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
                            <p className="text-xs text-slate-400 mb-1">ATM IV</p>
                            <p className="text-2xl font-bold text-purple-300 tabular-nums">{data.atmIv != null ? `${data.atmIv}%` : '—'}</p>
                            <p className={`text-xs font-medium mt-0.5 ${data.atmIvp === 'High' ? 'text-red-400' : data.atmIvp === 'Low' ? 'text-emerald-400' : 'text-amber-400'}`}>
                                IVP: {data.atmIvp ?? '—'}
                            </p>
                        </div>
                    </div>

                    {/* Row 2: Max Pain + Activity */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 flex items-center gap-3">
                            <div>
                                <p className="text-xs text-slate-400 mb-0.5">Max Pain Strike</p>
                                <p className="text-lg font-bold text-white">{data.maxPainStrike ?? '—'}</p>
                                <p className={`text-xs font-medium ${data.maxPainType === 'Bullish' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {data.maxPainType ?? '—'}
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3">
                            <p className="text-xs text-slate-400 mb-0.5">Activity Signal</p>
                            {data.activity ? (
                                <div className="flex items-center gap-1.5">
                                    <ActivityIcon size={14} className={activityColor} />
                                    <p className={`text-sm font-bold ${activityColor}`}>{data.activity}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No signal</p>
                            )}
                            <p className={`text-xs mt-0.5 ${activityColor}`}>{data.activityDir ?? '—'}</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">via Sensibull · PCR &gt;1.2 bullish · &lt;0.8 bearish</p>
                        <div className="flex gap-3">
                            {LINKS.map(l => (
                                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-0.5">
                                    <ExternalLink size={9} /> {l.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
