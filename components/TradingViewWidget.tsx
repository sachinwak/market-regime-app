'use client';

import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
    symbol: string;
    width?: string | number;
    height?: number;
    theme?: 'dark' | 'light';
    interval?: string;
    hideLegend?: boolean;
}

export default function TradingViewWidget({
    symbol,
    width = '100%',
    height = 200,
    theme = 'dark',
    interval = 'D',
    hideLegend = true,
}: TradingViewWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Clear previous
        container.innerHTML = '';

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container__widget';
        container.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            symbol,
            width,
            height,
            locale: 'en',
            dateRange: '1M',
            colorTheme: theme,
            isTransparent: true,
            autosize: false,
            largeChartUrl: '',
            chartOnly: false,
            noTimeScale: false,
        });
        container.appendChild(script);
        scriptRef.current = script;

        return () => {
            if (container) container.innerHTML = '';
        };
    }, [symbol, theme, height, width]);

    return (
        <div
            ref={containerRef}
            className="tradingview-widget-container"
            style={{ height }}
        />
    );
}
