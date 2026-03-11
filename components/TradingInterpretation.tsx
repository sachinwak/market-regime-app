'use client';

import { Signal } from '@/types/market';
import { TrendingUp, TrendingDown, Minus, ShieldAlert, Target, AlertTriangle, BookOpen, Zap } from 'lucide-react';

interface Props {
    signals: Signal[];
}

type Regime = 'TREND' | 'RANGE' | 'TRAP' | 'LOADING';

function classifyRegime(signals: Signal[]): { regime: Regime; score: number; max: number } {
    if (signals.length === 0) return { regime: 'LOADING', score: 0, max: 0 };
    const score = signals.reduce((s, sig) => s + sig.strength, 0);
    const max = signals.length;
    const vixSig = signals.find(s => s.name === 'India VIX');
    const isHighVix = vixSig?.strength === -1;
    const conflicting = signals.filter(s => s.strength !== 0).length;
    const bullish = signals.filter(s => s.strength > 0).length;
    const bearish = signals.filter(s => s.strength < 0).length;

    if (isHighVix && conflicting >= 3) return { regime: 'TRAP', score, max };
    if (bullish >= Math.ceil(max * 0.5)) return { regime: 'TREND', score, max };
    if (bearish >= Math.ceil(max * 0.5)) return { regime: 'TREND', score, max }; // strong bear = trend down
    return { regime: 'RANGE', score, max };
}

const REGIME_CONFIG = {
    TREND: {
        color: 'text-emerald-400',
        bg: 'from-emerald-950/80 via-slate-950/60 to-slate-950/80',
        border: 'border-emerald-500/30',
        glow: 'shadow-[0_0_40px_-8px_rgba(52,211,153,0.25)]',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: TrendingUp,
        emoji: '📈',
        title: 'TREND DAY',
        subtitle: 'Position Trade — Hold Winners',
        strategyTitle: 'Trade with the Trend',
        strategy: [
            { icon: '🎯', label: 'Entry', text: 'First pullback after 9:30 AM in trend direction. Wait for 15-min candle to confirm direction.' },
            { icon: '📌', label: 'Stop Loss', text: 'Below VWAP or previous 15-min swing low. Keep wide enough — trend days have normal pullbacks.' },
            { icon: '🏆', label: 'Target', text: 'Previous day high/low, ATR × 2. Use trailing stop — do NOT take early exits.' },
            { icon: '⏳', label: 'Holding', text: 'HOLD winners. Position trade mindset. Avoid exiting on every small dip.' },
            { icon: '❌', label: 'Avoid', text: 'Counter-trend trades. Scalping. Taking profits too early.' },
        ],
        conditions: [
            'Global markets aligned (S&P, Nikkei same direction)',
            'Dollar stable or falling',
            'Rupee stable or strengthening',
            'India VIX low (< 18)',
            'Asian markets trending same way',
        ],
        risk: { size: 'Normal (1-2%)', stops: 'Wide — trend has pullbacks', targets: 'Large (2R–4R)', style: 'text-emerald-400' },
    },
    RANGE: {
        color: 'text-blue-400',
        bg: 'from-blue-950/80 via-slate-950/60 to-slate-950/80',
        border: 'border-blue-500/30',
        glow: 'shadow-[0_0_40px_-8px_rgba(96,165,250,0.25)]',
        badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        icon: Minus,
        emoji: '↔️',
        title: 'RANGE DAY',
        subtitle: 'Scalp — Quick Profit, Quick Exit',
        strategyTitle: 'Buy Low, Sell High within the Range',
        strategy: [
            { icon: '🎯', label: 'Entry', text: 'Buy near Max Put OI strike (support). Sell near Max Call OI strike (resistance). Wait for range to form by 9:45 AM.' },
            { icon: '📌', label: 'Stop Loss', text: 'Tight stop just beyond range extremes. If price breaks out with volume — exit immediately.' },
            { icon: '🏆', label: 'Target', text: 'Opposite end of range. PCR-neutral zones. Keep R:R minimum 1:1.' },
            { icon: '⚡', label: 'Style', text: 'Scalp mindset — quick in, quick out. Do NOT hold overnight or through lunch.' },
            { icon: '❌', label: 'Avoid', text: 'Breakout trades. Wide stops. Holding positions in mid-range hoping for a trend.' },
        ],
        conditions: [
            'Mixed global markets — no clear direction',
            'Option chain has strong OI both sides',
            'Low volume / consolidation',
            'VIX moderate (15–22)',
            'Asian markets mixed',
        ],
        risk: { size: 'Small (0.5–1%)', stops: 'Tight — at range edge', targets: 'Small (1R–1.5R)', style: 'text-blue-400' },
    },
    TRAP: {
        color: 'text-red-400',
        bg: 'from-red-950/80 via-slate-950/60 to-slate-950/80',
        border: 'border-red-500/30',
        glow: 'shadow-[0_0_40px_-8px_rgba(248,113,113,0.25)]',
        badge: 'bg-red-500/20 text-red-300 border-red-500/40',
        icon: ShieldAlert,
        emoji: '⚠️',
        title: 'TRAP DAY',
        subtitle: 'NO TRADE — Capital Preservation',
        strategyTitle: 'Sit on Hands — Protect Capital',
        strategy: [
            { icon: '🛑', label: 'Action', text: 'DO NOT TRADE. Fake breakouts, whipsaws and stop-hunts will destroy your account.' },
            { icon: '👀', label: 'Observe', text: 'Watch for a clear breakout with volume AFTER 10:30 AM. Only enter if all signals finally align.' },
            { icon: '⚡', label: 'If you must', text: 'Tiny size only (0.25%). Fade the initial breakout at extremes with very tight stop.' },
            { icon: '📋', label: 'Use the day', text: 'Review your trade log. Study charts. Plan for tomorrow. No FOMO.' },
            { icon: '❌', label: 'Never do', text: 'Chase breakouts. Average down. Hold through gaps. Large position size.' },
        ],
        conditions: [
            'High VIX (> 22) — expect fake moves',
            'Conflicting signals (global vs domestic)',
            'Gap opposite to global trend',
            'Major news / event day',
            'Liquidity sweep forming',
        ],
        risk: { size: 'ZERO (sit out)', stops: 'N/A', targets: 'N/A', style: 'text-red-400' },
    },
    LOADING: {
        color: 'text-slate-400', bg: 'from-slate-900 to-slate-900', border: 'border-slate-700',
        glow: '', badge: 'bg-slate-700 text-slate-400 border-slate-600', icon: Minus, emoji: '⏳',
        title: 'LOADING...', subtitle: 'Fetching signals...', strategyTitle: '', strategy: [], conditions: [],
        risk: { size: '—', stops: '—', targets: '—', style: 'text-slate-400' },
    },
};

export default function TradingInterpretation({ signals }: Props) {
    const { regime } = classifyRegime(signals);
    const cfg = REGIME_CONFIG[regime];
    const Icon = cfg.icon;

    // Layer breakdown
    const globalSigs = signals.filter(s => ['S&P 500', 'DXY', 'US 10Y Yield', 'Gold', 'Brent Crude'].includes(s.name));
    const domesticSigs = signals.filter(s => ['USD/INR', 'FII Flow', 'India VIX'].includes(s.name));
    const marketSigs = signals.filter(s => ['Option PCR', 'Pre-Market Structure'].includes(s.name));

    const layerScore = (sigs: Signal[]) => sigs.reduce((a, s) => a + s.strength, 0);
    const layerIcon = (score: number) =>
        score > 0 ? <TrendingUp size={12} className="text-emerald-400" /> :
            score < 0 ? <TrendingDown size={12} className="text-red-400" /> :
                <Minus size={12} className="text-amber-400" />;
    const layerColor = (score: number) => score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-amber-400';
    const layerLabel = (score: number) => score > 0 ? 'Bullish' : score < 0 ? 'Bearish' : 'Neutral';

    if (regime === 'LOADING') return (
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/3 mb-4" />
            <div className="h-4 bg-slate-800 rounded w-2/3" />
        </section>
    );

    return (
        <section className={`relative rounded-2xl border ${cfg.border} ${cfg.glow} overflow-hidden`}>
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${cfg.bg} opacity-90`} />

            <div className="relative p-6 space-y-5">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <BookOpen size={15} className="text-slate-400" />
                            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">Today&apos;s Intraday Interpretation</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Icon size={28} className={cfg.color} />
                            <div>
                                <h2 className={`text-2xl font-black tracking-tight ${cfg.color}`}>{cfg.emoji} {cfg.title}</h2>
                                <p className="text-sm text-slate-300 font-medium mt-0.5">{cfg.subtitle}</p>
                            </div>
                        </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${cfg.badge}`}>
                        {signals.length} signals
                    </span>
                </div>

                {/* 3-Layer Model from doc */}
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Zap size={10} /> 3-Layer Model Check
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: '🌐 Global', sigs: globalSigs, desc: 'S&P · DXY · Yield · Gold · Oil' },
                            { label: '🇮🇳 Domestic', sigs: domesticSigs, desc: 'USD/INR · FII Flow · VIX' },
                            { label: '📊 Market', sigs: marketSigs, desc: 'Option Chain · Pre-Market Gap' },
                        ].map(({ label, sigs, desc }) => {
                            const score = layerScore(sigs);
                            return (
                                <div key={label} className="bg-slate-900/70 border border-slate-700/50 rounded-xl p-3">
                                    <p className="text-xs text-slate-400 mb-1 font-medium">{label}</p>
                                    <div className={`flex items-center gap-1 ${layerColor(score)} font-bold text-sm`}>
                                        {layerIcon(score)} {layerLabel(score)}
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 leading-tight">{desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Strategy Steps */}
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Target size={10} /> {cfg.strategyTitle}
                    </p>
                    <div className="space-y-2">
                        {cfg.strategy.map((s) => (
                            <div key={s.label}
                                className="flex items-start gap-3 bg-slate-900/60 border border-slate-700/40 rounded-xl px-4 py-2.5">
                                <span className="text-base leading-tight mt-0.5 shrink-0">{s.icon}</span>
                                <div>
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{s.label}: </span>
                                    <span className="text-xs text-slate-400">{s.text}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk params + Conditions — side by side */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Risk management */}
                    <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                            <AlertTriangle size={10} /> Risk Parameters
                        </p>
                        {[
                            { label: 'Position Size', value: cfg.risk.size },
                            { label: 'Stop Style', value: cfg.risk.stops },
                            { label: 'Targets', value: cfg.risk.targets },
                        ].map(item => (
                            <div key={item.label} className="flex justify-between items-center py-1 border-b border-slate-800 last:border-0">
                                <span className="text-xs text-slate-500">{item.label}</span>
                                <span className={`text-xs font-semibold ${cfg.risk.style}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Conditions that led to this call */}
                    <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Typical Conditions</p>
                        <ul className="space-y-1">
                            {cfg.conditions.map((c, i) => (
                                <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                    <span className={`mt-0.5 shrink-0 ${cfg.color}`}>•</span> {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Source note */}
                <p className="text-xs text-slate-600 text-center">
                    Based on your 3-Layer Market Regime Framework · Global → Domestic → Market
                </p>
            </div>
        </section>
    );
}
