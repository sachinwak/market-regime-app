export interface MarketQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    currency: string;
}

export interface Signal {
    name: string;
    direction: 'up' | 'down' | 'neutral';
    strength: number;
    description: string;
}

export type RegimeType = 'trend' | 'range' | 'trap' | 'loading';

export interface RegimeResult {
    regime: RegimeType;
    score: number;
    signals: Signal[];
    strategy: string;
    description: string;
}
