import { MarketQuote } from '@/types/market';

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_QUOTE = 'https://query1.finance.yahoo.com/v7/finance/quote';

export async function fetchQuote(symbol: string): Promise<MarketQuote | null> {
    try {
        const res = await fetch(
            `/api/yahoo?symbol=${encodeURIComponent(symbol)}`,
            { next: { revalidate: 300 } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data;
    } catch {
        return null;
    }
}

export async function fetchMultipleQuotes(symbols: string[]): Promise<(MarketQuote | null)[]> {
    return Promise.all(symbols.map(fetchQuote));
}

export async function fetchNseVix(): Promise<number | null> {
    try {
        const res = await fetch('/api/nse?type=vix', { next: { revalidate: 300 } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.vix;
    } catch {
        return null;
    }
}

export async function fetchFiiDii(): Promise<{ fii: number; dii: number } | null> {
    try {
        const res = await fetch('/api/nse?type=fiidii', { next: { revalidate: 300 } });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function fetchPcr(): Promise<{ pcr: number; callOi: number; putOi: number } | null> {
    try {
        const res = await fetch('/api/nse?type=pcr', { next: { revalidate: 300 } });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
