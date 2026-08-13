'use client';

import { useEffect, useRef, useState } from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';
import { Signal } from '@/types/market';

import { fetchFiiDiiData } from '@/lib/api-client';

interface Props {
    onSignal: (signal: Signal) => void;
}

interface FiiDiiData { fii: number | null; dii: number | null; date?: string | null; source: string; }

function formatCr(val: number | null) {
    if (val === null) return '—';
    // NSE returns values already in crores
    const abs = Math.abs(val);
    if (abs >= 10000) return `₹${(abs / 100).toFixed(0)} Cr`;
    return `₹${abs.toFixed(2)} Cr`;
}

export default function FiiDiiFlow({ onSignal }: Props) {
    const [data, setData] = useState<FiiDiiData | null>(null);
    const [loading, setLoading] = useState(true);
    const onSignalRef = useRef(onSignal);
    onSignalRef.current = onSignal;

    useEffect(() => {
        const fetch_ = async () => {
            setLoading(true);
            try {
                const d = await fetchFiiDiiData() as FiiDiiData;
                setData(d);
                    if (d.fii !== null) {
                        onSignalRef.current({
                            name: 'FII Flow',
                            direction: d.fii > 0 ? 'up' : d.fii < 0 ? 'down' : 'neutral',
                            strength: d.fii > 500 ? 1 : d.fii < -500 ? -1 : 0,
                            description: `FII Net: ₹${d.fii.toFixed(0)}Cr`,
                        });
                    } else {
                        onSignalRef.current({ name: 'FII Flow', direction: 'neutral', strength: 0, description: 'Check manually' });
                    }
            } catch (e) { /* silent */ }
            setLoading(false);
        };
        fetch_();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-cyan-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Step 4 — FII / DII Money Flow</h2>
            </div>

            {loading ? (
                <div className="space-y-2 animate-pulse">
                    <div className="h-16 bg-slate-800 rounded-xl" />
                    <div className="h-8 bg-slate-800 rounded-xl" />
                </div>
            ) : (data?.fii === null || data?.source === 'unavailable') ? (
                <div className="space-y-3">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-amber-400 text-sm font-medium mb-2">⚠️ FII/DII data requires manual check</p>
                        <p className="text-xs text-slate-400 mb-3">NSE blocks server-side requests. Check these links manually:</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: 'NSE FII/DII', url: 'https://www.nseindia.com/reports/fii-dii' },
                                { label: 'Moneycontrol', url: 'https://www.moneycontrol.com/stocks/marketstats/fii_activity/index.php' },
                            ].map(link => (
                                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1.5 rounded-lg transition-colors">
                                    <ExternalLink size={10} /> {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                        <div className="bg-slate-800/50 rounded-xl p-3">
                            <p className="text-emerald-400 font-semibold mb-1">🟢 FII Buying Heavily</p>
                            <p>→ Trending day possible, market bullish</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3">
                            <p className="text-red-400 font-semibold mb-1">🔴 FII Selling Heavily</p>
                            <p>→ Market weak, bearish pressure</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {data?.date && (
                        <p className="text-xs text-slate-500">As of: <span className="text-slate-400 font-medium">{data.date}</span></p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'FII / FPI Net', val: data?.fii ?? null, color: (data?.fii ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400', bg: (data?.fii ?? 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20' },
                            { label: 'DII Net', val: data?.dii ?? null, color: (data?.dii ?? 0) >= 0 ? 'text-blue-400' : 'text-orange-400', bg: (data?.dii ?? 0) >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20' },
                        ].map(item => (
                            <div key={item.label} className={`rounded-xl p-4 border ${item.val !== null ? item.bg : 'bg-slate-800/50 border-slate-700/30'}`}>
                                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                                <p className={`text-2xl font-bold tabular-nums ${item.color}`}>
                                    {item.val !== null ? `${item.val >= 0 ? '+' : ''}${formatCr(item.val)}` : '—'}
                                </p>
                                <p className={`text-xs mt-1 font-medium ${item.color}`}>
                                    {item.val !== null ? (item.val >= 0 ? '▲ Net Buyer' : '▼ Net Seller') : 'No data'}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500">Source: NSE India · Values in Indian Rupees Crores</p>
                </div>
            )}
        </section>
    );
}
