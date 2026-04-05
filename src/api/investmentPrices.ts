import type { SupportedAsset } from '@/types/models';
import { SUPPORTED_ASSETS } from '@/types/models';

// In development (no EXPO_PUBLIC_API_URL set), mock prices are used so the app
// works offline without a running Vercel instance.
// In production, set EXPO_PUBLIC_API_URL=https://ohrangefund-api.vercel.app

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const MOCK_PRICES_CENTS: Record<string, number> = {
  VWCE:  11423,
  CSPX:  55120,
  IWDA:   9870,
  VUSA:  10245,
  EIMI:   3318,
  AAPL:  21890,
  TSLA:  18750,
  MSFT:  42300,
  NVDA:  87600,
  AMZN:  20100,
  GOOGL: 17850,
  META:  55900,
  BTC:   8_245_000,
  ETH:     313_500,
  SOL:      14_800,
};

/** Returns the current price for a single ticker in EUR cents. */
export async function getAssetPrice(ticker: string): Promise<number> {
  if (!API_URL) return MOCK_PRICES_CENTS[ticker] ?? 0;
  const prices = await getAssetPrices([ticker]);
  return prices[ticker] ?? 0;
}

/** Returns prices for multiple tickers at once (batched). */
export async function getAssetPrices(
  tickers: string[],
): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};

  if (!API_URL) {
    return Object.fromEntries(tickers.map((t) => [t, MOCK_PRICES_CENTS[t] ?? 0]));
  }

  const query = tickers.join(',');
  const res = await fetch(`${API_URL}/api/prices?tickers=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Prices API HTTP ${res.status}`);
  return res.json() as Promise<Record<string, number>>;
}

export interface TickerSearchResult {
  ticker: string;
  name: string;
  exchange: string;
  type: 'stock' | 'etf' | 'crypto';
}

/** Search Yahoo Finance for tickers matching the query. */
export async function searchTickers(q: string): Promise<TickerSearchResult[]> {
  if (!API_URL || !q.trim()) return [];
  const res = await fetch(`${API_URL}/api/ticker-search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json() as Promise<TickerSearchResult[]>;
}

export { SUPPORTED_ASSETS };
export type { SupportedAsset };
