import type { SupportedAsset } from '@/types/models';
import { SUPPORTED_ASSETS } from '@/types/models';

// Mock prices in cents. Replace this implementation with a real API call (Alpha Vantage /
// CoinGecko) when ready — the interface stays the same.
const MOCK_PRICES_CENTS: Record<string, number> = {
  VWCE:  11423,   // €114.23
  CSPX:  55120,   // €551.20
  IWDA:  9870,    // €98.70
  VUSA:  10245,   // €102.45
  EIMI:  3318,    // €33.18
  AAPL:  21890,   // €218.90
  TSLA:  18750,   // €187.50
  MSFT:  42300,   // €423.00
  NVDA:  87600,   // €876.00
  AMZN:  20100,   // €201.00
  GOOGL: 17850,   // €178.50
  META:  55900,   // €559.00
  BTC:   8_245_000, // €82,450.00
  ETH:   313_500,   // €3,135.00
  SOL:   14_800,    // €148.00
};

/** Returns the current price for a ticker in cents. */
export async function getAssetPrice(ticker: string): Promise<number> {
  // Simulate a small async delay (matches real-API behaviour)
  await Promise.resolve();
  const price = MOCK_PRICES_CENTS[ticker];
  if (price === undefined) throw new Error(`Unknown ticker: ${ticker}`);
  return price;
}

/** Returns prices for multiple tickers at once (batched). */
export async function getAssetPrices(
  tickers: string[],
): Promise<Record<string, number>> {
  await Promise.resolve();
  return Object.fromEntries(
    tickers.map((t) => [t, MOCK_PRICES_CENTS[t] ?? 0]),
  );
}

export { SUPPORTED_ASSETS };
export type { SupportedAsset };
