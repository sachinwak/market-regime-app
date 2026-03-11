'use client';

import { Signal, RegimeType } from '@/types/market';
import { classifyRegime, getRegimeColor, getRegimeBg, getRegimeEmoji } from '@/lib/regime-classifier';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

interface Props {
    signals: Signal[];
}

const SIGNAL_ICONS = {
    up: <TrendingUp size={14} className="text-emerald-400" />,
    down: <TrendingDown size={14} className="text-red-400" />,
    neutral: <Minus size={14} className="text-amber-400" />,
};

export default function RegimeDecision({ signals }: Props) {
    if (signals.length === 0) {
        return (
            <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Zap size={18} className="text-yellow-400" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Final Decision — Regime Classifier</h2>
                </div>
                <div className="animate-pulse space-y-3">
                    <div className="h-24 bg-slate-800 rounded-xl" />
                    <div className="grid grid-cols-3 gap-3">
                        <div className="h-16 bg-slate-800 rounded-xl" />
                        <div className="h-16 bg-slate-800 rounded-xl" />
                        <div className="h-16 bg-slate-800 rounded-xl" />
                    </div>
                </div>
            </section>
        );
    }

    const result = classifyRegime(signals);
    const colorClass = getRegimeColor(result.regime);
    const bgClass = getRegimeBg(result.regime);
    const emoji = getRegimeEmoji(result.regime);

    const bullish = signals.filter(s => s.strength > 0).length;
    const bearish = signals.filter(s => s.strength < 0).length;
    const neutral = signals.filter(s => s.strength === 0).length;

    const regimeLabels: Record<RegimeType, string> = {
        trend: 'TREND DAY',
        range: 'RANGE DAY',
        trap: 'TRAP DAY',
        loading: 'LOADING...',
    };

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-yellow-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Final Decision — Regime Classifier</h2>
            </div>

            {/* Main Result */}
            <div className={`rounded-2xl p-5 border bg-gradient-to-br mb-4 ${bgClass}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Today's Market Regime</p>
                        <div className="flex items-center gap-3">
                            <span className="text-5xl">{emoji}</span>
                            <div>
                                <p className={`text-3xl font-black ${colorClass}`}>{regimeLabels[result.regime]}</p>
                                <p className="text-sm text-slate-400 mt-0.5">{result.description}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Signal Score</p>
                        <p className={`text-4xl font-black tabular-nums ${result.score > 0 ? 'text-emerald-400' : result.score < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                            {result.score > 0 ? '+' : ''}{result.score}/{signals.length}
                        </p>
                    </div>
                </div>

                <div className={`mt-4 p-3 rounded-xl bg-black/20`}>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Strategy</p>
                    <p className={`text-lg font-bold ${colorClass}`}>{result.strategy}</p>
                </div>
            </div>

            {/* Signal bars */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                    { label: '🟢 Bullish', count: bullish, total: signals.length, color: 'bg-emerald-500' },
                    { label: '🟡 Neutral', count: neutral, total: signals.length, color: 'bg-amber-500' },
                    { label: '🔴 Bearish', count: bearish, total: signals.length, color: 'bg-red-500' },
                ].map(({ label, count, total, color }) => (
                    <div key={label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-500 mb-1">{label}</p>
                        <p className="text-2xl font-black text-white">{count}</p>
                        <div className="h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${(count / total) * 100}%` }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Individual signals */}
            <div className="space-y-1.5">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Signal Breakdown</p>
                {signals.map((sig, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-800/40 rounded-lg">
                        {SIGNAL_ICONS[sig.direction]}
                        <span className="text-xs text-slate-300 flex-1 font-medium">{sig.name}</span>
                        <span className="text-xs text-slate-500">{sig.description}</span>
                        <span className={`text-xs font-bold w-6 text-center ${sig.strength > 0 ? 'text-emerald-400' : sig.strength < 0 ? 'text-red-400' : 'text-amber-400'}`}>
                            {sig.strength > 0 ? '+1' : sig.strength < 0 ? '-1' : '0'}
                        </span>
                    </div>
                ))}
            </div>

            {/* 3-Layer Model */}
            <div className="mt-4 p-4 bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Professional 3-Layer Model</p>
                <div className="flex items-center justify-center gap-2 text-xs">
                    {[
                        { label: 'GLOBAL', items: ['US Markets', 'Dollar', 'Oil', 'Gold'], color: 'text-blue-400 border-blue-500/30' },
                        { label: '↓', items: [], color: 'text-slate-600' },
                        { label: 'DOMESTIC', items: ['FII Flow', 'Rupee', 'VIX'], color: 'text-amber-400 border-amber-500/30' },
                        { label: '↓', items: [], color: 'text-slate-600' },
                        { label: 'MARKET', items: ['Option Chain', 'Price Structure'], color: 'text-emerald-400 border-emerald-500/30' },
                    ].map((layer, i) => (
                        layer.items.length > 0 ? (
                            <div key={i} className={`border rounded-xl p-2 text-center ${layer.color}`}>
                                <p className="font-bold text-xs">{layer.label}</p>
                                {layer.items.map(item => <p key={item} className="text-slate-500 text-xs">{item}</p>)}
                            </div>
                        ) : (
                            <span key={i} className={`text-lg ${layer.color}`}>{layer.label}</span>
                        )
                    ))}
                </div>
            </div>
        </section>
    );
}
