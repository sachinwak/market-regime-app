import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    try {
        if (type === 'vix') {
            // Fetch India VIX from Yahoo Finance as NSE blocks CORS
            const res = await fetch(
                'https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d&range=2d',
                { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
            );
            if (!res.ok) return NextResponse.json({ vix: null }, { status: 200 });
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            return NextResponse.json({
                vix: meta?.regularMarketPrice ?? null,
                change: meta ? meta.regularMarketPrice - (meta.previousClose ?? meta.regularMarketPrice) : 0,
            });
        }

        if (type === 'fiidii') {
            const NSE_HEADERS = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
            };

            try {
                // Step 1: Hit NSE homepage to get session cookies
                const homeRes = await fetch('https://www.nseindia.com/reports/fii-dii', {
                    headers: {
                        ...NSE_HEADERS,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Upgrade-Insecure-Requests': '1',
                    },
                    // No cache — we need a fresh session every time
                });

                // Collect all Set-Cookie headers
                const rawCookies = homeRes.headers.getSetCookie?.() ?? [];
                const cookieStr = rawCookies
                    .map((c: string) => c.split(';')[0])
                    .join('; ');

                // Step 2: Call the FII/DII API with the session cookies
                const fiiRes = await fetch('https://www.nseindia.com/api/fiidiiTradeReact', {
                    headers: {
                        ...NSE_HEADERS,
                        'Referer': 'https://www.nseindia.com/reports/fii-dii',
                        'Cookie': cookieStr,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (fiiRes.ok) {
                    const data = await fiiRes.json();

                    if (Array.isArray(data) && data.length > 0) {
                        // NSE returns rows per category — find FII/FPI and DII
                        const fiiRow = data.find((d: Record<string, unknown>) =>
                            String(d.category ?? '').includes('FII') || String(d.category ?? '').includes('FPI')
                        );
                        const diiRow = data.find((d: Record<string, unknown>) =>
                            String(d.category ?? '').toLowerCase().includes('dii')
                        );

                        const fiiNet = fiiRow ? Number(fiiRow.netVal ?? fiiRow.netValue ?? fiiRow.net_val ?? 0) : null;
                        const diiNet = diiRow ? Number(diiRow.netVal ?? diiRow.netValue ?? diiRow.net_val ?? 0) : null;
                        const date = fiiRow?.date ?? diiRow?.date ?? null;

                        if (fiiNet !== null || diiNet !== null) {
                            return NextResponse.json({ fii: fiiNet, dii: diiNet, date, source: 'nse' });
                        }
                    }
                }
            } catch (e) {
                console.error('NSE FII/DII fetch error:', e);
            }

            // Fallback: return null values (will show manual check links in UI)
            return NextResponse.json({ fii: null, dii: null, source: 'unavailable' });
        }

        if (type === 'pcr') {
            // Fetch Nifty option chain from NSE
            try {
                const res = await fetch(
                    'https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY',
                    {
                        headers: {
                            'User-Agent': 'Mozilla/5.0',
                            'Accept': 'application/json',
                            'Referer': 'https://www.nseindia.com',
                        },
                        next: { revalidate: 300 },
                    }
                );
                if (res.ok) {
                    const data = await res.json();
                    const filtered = data?.filtered;
                    const totalCE = filtered?.CE?.totOI ?? 0;
                    const totalPE = filtered?.PE?.totOI ?? 0;
                    const pcr = totalCE > 0 ? totalPE / totalCE : 0;
                    return NextResponse.json({ pcr, callOi: totalCE, putOi: totalPE });
                }
            } catch { /* fall through */ }
            return NextResponse.json({ pcr: null, callOi: null, putOi: null });
        }

        return NextResponse.json({ error: 'unknown type' }, { status: 400 });
    } catch (err) {
        console.error('NSE route error:', err);
        return NextResponse.json({ error: 'internal error' }, { status: 500 });
    }
}
