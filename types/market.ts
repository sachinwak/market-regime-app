export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency?: string;
}

export type Direction = 'up' | 'down' | 'neutral';

export interface Signal {
  name: string;
  direction: Direction;
  strength: number; // -1 bearish, 0 neutral, +1 bullish
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

export interface FiiDiiData {
  date: string;
  fii_net: number;
  dii_net: number;
}

export interface VixData {
  value: number;
  change: number;
  changePercent: number;
}

export interface AsianMarket {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}
