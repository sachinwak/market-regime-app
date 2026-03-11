'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { MarketQuote } from '@/types/market';

interface MarketCardProps {
    quote: MarketQuote | null;
    label: string;
    description?: string;
    loading?: boolean;
    invertSignal?: boolean; // DXY: up is bearish for market
}

export default function MarketCard({ quote, label, description, loading, invertSignal }: MarketCardProps) {
    if (loading) {
        return (
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-slate-700 rounded w-2/3 mb-2" />
                <div className="h-7 bg-slate-700 rounded w-1/2 mb-1" />
                <div className="h-3 bg-slate-700 rounded w-1/3" />
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="bg-slate-800/60 border border-dashed border-slate-700/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm text-slate-400">Data unavailable</p>
                {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
            </div>
        );
    }

    const isUp = quote.changePercent > 0;
    const isDown = quote.changePercent < 0;

    // For assets where up = bad (DXY, Bond Yield, Oil can be contextual)
    const positiveIsGood = !invertSignal;
    const colorClass = isUp
        ? (positiveIsGood ? 'text-emerald-400' : 'text-red-400')
        : isDown
            ? (positiveIsGood ? 'text-red-400' : 'text-emerald-400')
            : 'text-slate-400';

    const bgClass = isUp
        ? (positiveIsGood ? 'bg-emerald-400/10 border-emerald-500/20' : 'bg-red-400/10 border-red-500/20')
        : isDown
            ? (positiveIsGood ? 'bg-red-400/10 border-red-500/20' : 'bg-emerald-400/10 border-emerald-500/20')
            : 'bg-slate-700/30 border-slate-700/30';

    const formatPrice = (p: number) => {
        if (p > 10000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
        if (p > 100) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return p.toFixed(2);
    };

    return (
        <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-[1.02] ${bgClass} bg-slate-800/40`}>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1 font-medium">{label}</p>
            <div className="flex items-end justify-between gap-2">
                <p className="text-xl font-bold text-white tabular-nums">{formatPrice(quote.price)}</p>
                <div className={`flex items-center gap-1 text-sm font-semibold ${colorClass}`}>
                    {isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : <Minus size={14} />}
                    <span>{quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%</span>
                </div>
            </div>
            <p className={`text-xs mt-1 font-medium ${colorClass}`}>
                {isUp ? '↑' : isDown ? '↓' : '→'} {Math.abs(quote.change).toFixed(2)}
                {description && <span className="text-slate-500 ml-2">{description}</span>}
            </p>
        </div>
    );
}
