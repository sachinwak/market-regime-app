'use client';

import { CheckSquare, Square, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const QUESTIONS = [
    { id: 1, text: 'What happened in the US market overnight?', category: 'Global' },
    { id: 2, text: 'What is the Dollar (DXY) doing?', category: 'Global' },
    { id: 3, text: 'What is the US 10Y Bond Yield doing?', category: 'Global' },
    { id: 4, text: 'What is Brent Crude Oil doing?', category: 'Global' },
    { id: 5, text: 'What are Asian markets (Nikkei, Hang Seng) doing?', category: 'Asian' },
    { id: 6, text: 'Is USD/INR (Rupee) rising or falling?', category: 'Domestic' },
    { id: 7, text: 'Are FIIs buying or selling? (check NSE/Moneycontrol)', category: 'Domestic' },
    { id: 8, text: 'What is India VIX level?', category: 'Domestic' },
    { id: 9, text: 'Where is option chain liquidity (PCR, max OI)?', category: 'Market' },
];

const CATEGORY_COLORS: Record<string, string> = {
    Global: 'text-blue-400 bg-blue-400/10',
    Asian: 'text-purple-400 bg-purple-400/10',
    Domestic: 'text-amber-400 bg-amber-400/10',
    Market: 'text-emerald-400 bg-emerald-400/10',
};

export default function DailyChecklist() {
    const [checked, setChecked] = useState<Set<number>>(new Set());

    const toggle = (id: number) => {
        setChecked(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const reset = () => setChecked(new Set());
    const progress = Math.round((checked.size / QUESTIONS.length) * 100);

    return (
        <section className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CheckSquare size={18} className="text-emerald-400" />
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Daily Checklist</h2>
                    <span className="text-xs text-slate-500">(10–15 min ritual)</span>
                </div>
                <button onClick={reset} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    <RefreshCw size={12} /> Reset
                </button>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{checked.size} / {QUESTIONS.length} completed</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="space-y-2">
                {QUESTIONS.map(q => (
                    <button
                        key={q.id}
                        onClick={() => toggle(q.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${checked.has(q.id)
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'bg-slate-800/50 border border-transparent hover:border-slate-700'
                            }`}
                    >
                        {checked.has(q.id)
                            ? <CheckSquare size={16} className="text-emerald-400 shrink-0" />
                            : <Square size={16} className="text-slate-600 shrink-0" />
                        }
                        <span className={`text-xs font-medium flex-1 ${checked.has(q.id) ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                            {q.id}. {q.text}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CATEGORY_COLORS[q.category]}`}>
                            {q.category}
                        </span>
                    </button>
                ))}
            </div>

            {checked.size === QUESTIONS.length && (
                <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <p className="text-emerald-400 font-bold text-sm">✅ Pre-market analysis complete! Ready to trade.</p>
                </div>
            )}
        </section>
    );
}
