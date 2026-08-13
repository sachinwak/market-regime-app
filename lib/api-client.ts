// We use a CORS proxy to allow fetching from external APIs directly on the client.
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export const fetchProxied = async (url: string, options?: RequestInit) => {
  const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
  return fetch(proxiedUrl, options);
};

export const fetchYahooData = async (symbol: string) => {
    try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
        const res = await fetchProxied(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!res.ok) {
            const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`;
            const quoteRes = await fetchProxied(quoteUrl);
            if (!quoteRes.ok) throw new Error('fetch failed');
            const quoteData = await quoteRes.json();
            const q = quoteData?.quoteResponse?.result?.[0];
            if (!q) throw new Error('no data');
            return {
                symbol: q.symbol,
                name: q.shortName || q.longName || symbol,
                price: q.regularMarketPrice ?? 0,
                change: q.regularMarketChange ?? 0,
                changePercent: q.regularMarketChangePercent ?? 0,
                previousClose: q.regularMarketPreviousClose ?? 0,
                currency: q.currency,
            };
        }

        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) throw new Error('no meta');

        const price = meta.regularMarketPrice ?? 0;
        const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price;
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

        return {
            symbol,
            name: meta.instrumentType || symbol,
            price,
            change,
            changePercent,
            previousClose: prevClose,
            currency: meta.currency,
        };
    } catch (err) {
        console.error(`Yahoo API error for ${symbol}:`, err);
        return null;
    }
};

export const fetchVixData = async () => {
    try {
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/%5EINDIAVIX?interval=1d&range=2d';
        const res = await fetchProxied(url);
        if (!res.ok) return { vix: null };
        const data = await res.json();
        const meta = data?.chart?.result?.[0]?.meta;
        return {
            vix: meta?.regularMarketPrice ?? null,
            change: meta ? meta.regularMarketPrice - (meta.previousClose ?? meta.regularMarketPrice) : 0,
        };
    } catch {
        return { vix: null };
    }
};

export const fetchFiiDiiData = async () => {
    try {
        // NSE API is strictly protected. Attempting to fetch via proxy.
        // It often fails due to WAF, but we try. If it fails, component shows fallback manual links.
        const url = 'https://www.nseindia.com/api/fiidiiTradeReact';
        const res = await fetchProxied(url);
        if (res.ok) {
            const data = await res.json();
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
                    return { fii: fiiNet, dii: diiNet, date, source: 'nse' };
                }
            }
        }
    } catch (e) {
        console.error('NSE FII/DII fetch error:', e);
    }
    return { fii: null, dii: null, source: 'unavailable' };
};

export const fetchPcrData = async () => {
    try {
        const url = 'https://oxide.sensibull.com/v1/compute/cache/insights/stock_info?tradingsymbol=NIFTY';
        const res = await fetchProxied(url);

        if (res.ok) {
            const json = await res.json();
            const payload = json?.payload;

            const baseStats = payload?.stats?.underlying_base_stats;
            const perExpiryMap: Record<string, Record<string, unknown>> =
                payload?.stats?.per_expiry_map ?? {};
            const perExpiryData: Record<string, string> =
                payload?.underlying_info?.per_expiry_data ?? {};

            const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const todayStr = now.toISOString().split('T')[0];
            const weeklyExpiries = Object.keys(perExpiryData)
                .filter(d => perExpiryData[d] === 'weekly')
                .sort();
            const nearestExpiry = weeklyExpiries.find(d => d >= todayStr) ?? weeklyExpiries[0];
            const ed = perExpiryMap[nearestExpiry] ?? {};

            const pcr = ed.pcr ?? baseStats?.total_pcr ?? null;
            const atmIvRaw = typeof ed.atm_iv === 'number' ? ed.atm_iv : null;

            return {
                pcr: pcr !== null ? +Number(pcr).toFixed(2) : null,
                atmStrike: (ed.atm_strike as number) ?? null,
                atmIv: atmIvRaw !== null ? +(atmIvRaw * 100).toFixed(1) : null,
                atmIvp: (ed.atm_ivp_type as string) ?? null,
                maxPainStrike: (ed.max_pain_strike as number) ?? null,
                pcrType: (ed.pcr_type as string) ?? null,
                maxPainType: (ed.max_pain_type as string) ?? null,
                activity: (ed.activity as string) ?? null,
                activityDir: (ed.activity_direction as string) ?? null,
                futurePrice: ed.future_price ? +Number(ed.future_price).toFixed(2) : null,
                expiry: nearestExpiry ?? null,
                source: 'sensibull',
                callOi: null,
                putOi: null,
            };
        }
    } catch (e) {
        console.error('Sensibull PCR fetch error:', e);
    }
    return { pcr: null, callOi: null, putOi: null };
};
