import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    try {
        // ─── VIX ────────────────────────────────────────────────────────────────
        if (type === 'vix') {
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

        // ─── FII / DII ───────────────────────────────────────────────────────────
        if (type === 'fiidii') {
            const NSE_HEADERS = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
            };

            try {
                const homeRes = await fetch('https://www.nseindia.com/reports/fii-dii', {
                    headers: {
                        ...NSE_HEADERS,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Upgrade-Insecure-Requests': '1',
                    },
                });

                const rawCookies = homeRes.headers.getSetCookie?.() ?? [];
                const cookieStr = rawCookies.map((c: string) => c.split(';')[0]).join('; ');

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

            return NextResponse.json({ fii: null, dii: null, source: 'unavailable' });
        }

        // ─── PCR / OPTION CHAIN — via Sensibull oxide API (no auth required) ────
        if (type === 'pcr') {
            try {
                const res = await fetch(
                    'https://oxide.sensibull.com/v1/compute/cache/insights/stock_info?tradingsymbol=NIFTY',
                    {
                        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
                        cache: 'no-store', // always fetch fresh — no stale cached nulls
                    }
                );

                if (res.ok) {
                    const json = await res.json();
                    const payload = json?.payload;

                    // stats is at payload.stats (NOT payload.underlying_info.stats)
                    const baseStats = payload?.stats?.underlying_base_stats;
                    const perExpiryMap: Record<string, Record<string, unknown>> =
                        payload?.stats?.per_expiry_map ?? {};

                    // per_expiry_data is at payload.underlying_info.per_expiry_data
                    const perExpiryData: Record<string, string> =
                        payload?.underlying_info?.per_expiry_data ?? {};

                    // Pick nearest weekly expiry >= today (IST)
                    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                    const todayStr = now.toISOString().split('T')[0];
                    const weeklyExpiries = Object.keys(perExpiryData)
                        .filter(d => perExpiryData[d] === 'weekly')
                        .sort();
                    const nearestExpiry = weeklyExpiries.find(d => d >= todayStr) ?? weeklyExpiries[0];
                    const ed = perExpiryMap[nearestExpiry] ?? {};

                    const pcr = ed.pcr ?? baseStats?.total_pcr ?? null;
                    const atmIvRaw = typeof ed.atm_iv === 'number' ? ed.atm_iv : null;

                    return NextResponse.json({
                        pcr: pcr !== null ? +Number(pcr).toFixed(2) : null,
                        atmStrike: ed.atm_strike ?? null,
                        atmIv: atmIvRaw !== null ? +(atmIvRaw * 100).toFixed(1) : null,
                        atmIvp: ed.atm_ivp_type ?? null,
                        maxPainStrike: ed.max_pain_strike ?? null,
                        pcrType: ed.pcr_type ?? null,
                        maxPainType: ed.max_pain_type ?? null,
                        activity: ed.activity ?? null,
                        activityDir: ed.activity_direction ?? null,
                        futurePrice: ed.future_price ? +Number(ed.future_price).toFixed(2) : null,
                        expiry: nearestExpiry ?? null,
                        source: 'sensibull',
                        callOi: null,
                        putOi: null,
                    });
                }
            } catch (e) {
                console.error('Sensibull PCR fetch error:', e);
            }
            return NextResponse.json({ pcr: null, callOi: null, putOi: null });
        }

        return NextResponse.json({ error: 'unknown type' }, { status: 400 });

    } catch (err) {
        console.error('NSE route error:', err);
        return NextResponse.json({ error: 'internal error' }, { status: 500 });
    }
}
