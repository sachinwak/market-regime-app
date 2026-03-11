import { Signal, RegimeType, RegimeResult } from '@/types/market';

export function classifyRegime(signals: Signal[]): RegimeResult {
    const score = signals.reduce((sum, s) => sum + s.strength, 0);
    const maxScore = signals.length;

    let regime: RegimeType;
    let strategy: string;
    let description: string;

    // Count conflicting signals (trap indicator)
    const bullish = signals.filter(s => s.strength > 0).length;
    const bearish = signals.filter(s => s.strength < 0).length;
    const conflict = Math.min(bullish, bearish);
    const hasHighVix = signals.find(s => s.name === 'India VIX')?.strength === -1;

    if (hasHighVix && conflict >= 2) {
        regime = 'trap';
        strategy = 'NO TRADE — Capital Preservation';
        description = 'High volatility with conflicting signals. Fake moves likely. Sit on hands.';
    } else if (Math.abs(score) >= maxScore * 0.5) {
        regime = 'trend';
        strategy = score > 0 ? 'LONG — Position Trade, Hold Winners' : 'SHORT — Position Trade, Hold Losers';
        description = score > 0
            ? 'Strong bullish alignment across global & domestic signals. Trend day likely.'
            : 'Strong bearish alignment across global & domestic signals. Trend day likely.';
    } else {
        regime = 'range';
        strategy = 'SCALP — Quick Profits, Early Exit';
        description = 'Mixed signals with no clear direction. Range-bound or choppy day expected.';
    }

    return { regime, score, signals, strategy, description };
}

export function getRegimeColor(regime: RegimeType): string {
    switch (regime) {
        case 'trend': return 'text-emerald-400';
        case 'range': return 'text-amber-400';
        case 'trap': return 'text-red-400';
        default: return 'text-slate-400';
    }
}

export function getRegimeBg(regime: RegimeType): string {
    switch (regime) {
        case 'trend': return 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/40';
        case 'range': return 'from-amber-500/20 to-amber-900/10 border-amber-500/40';
        case 'trap': return 'from-red-500/20 to-red-900/10 border-red-500/40';
        default: return 'from-slate-500/20 to-slate-900/10 border-slate-500/40';
    }
}

export function getRegimeEmoji(regime: RegimeType): string {
    switch (regime) {
        case 'trend': return '📈';
        case 'range': return '↔️';
        case 'trap': return '⚠️';
        default: return '⏳';
    }
}
