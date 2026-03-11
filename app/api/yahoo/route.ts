import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
        return NextResponse.json({ error: 'symbol required' }, { status: 400 });
    }

    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            next: { revalidate: 300 },
        });

        if (!res.ok) {
            // Fallback to v7 quote API
            const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
            const quoteRes = await fetch(quoteUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                next: { revalidate: 300 },
            });
            if (!quoteRes.ok) return NextResponse.json({ error: 'fetch failed' }, { status: 502 });
            const quoteData = await quoteRes.json();
            const q = quoteData?.quoteResponse?.result?.[0];
            if (!q) return NextResponse.json({ error: 'no data' }, { status: 404 });
            return NextResponse.json({
                symbol: q.symbol,
                name: q.shortName || q.longName || symbol,
                price: q.regularMarketPrice ?? 0,
                change: q.regularMarketChange ?? 0,
                changePercent: q.regularMarketChangePercent ?? 0,
                previousClose: q.regularMarketPreviousClose ?? 0,
                currency: q.currency,
            });
        }

        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return NextResponse.json({ error: 'no meta' }, { status: 404 });

        const price = meta.regularMarketPrice ?? 0;
        const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

        return NextResponse.json({
            symbol,
            name: meta.instrumentType || symbol,
            price,
            change,
            changePercent,
            previousClose: prevClose,
            currency: meta.currency,
        });
    } catch (err) {
        console.error('Yahoo API error:', err);
        return NextResponse.json({ error: 'internal error' }, { status: 500 });
    }
}
