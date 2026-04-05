// Vercel Function: GET /api/prices?tickers=BTC,AAPL,VWCE,ASML.AS
// Returns prices in EUR cents for each requested ticker.
//
// Crypto conhecidos → CoinGecko (EUR nativo, sem key)
// Tickers mapeados → Yahoo Finance com símbolo correcto + moeda conhecida
// Tickers arbitrários → Yahoo Finance directamente, detecta moeda na resposta

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
};

// Tickers mapeados para símbolos Yahoo que cotizam em EUR ou USD (evita ambiguidade).
const YAHOO_SYMBOLS: Record<string, { symbol: string; currency: 'EUR' | 'USD' }> = {
  VWCE: { symbol: 'VWCE.DE',  currency: 'EUR' },
  CSPX: { symbol: 'SXR8.DE',  currency: 'EUR' },
  IWDA: { symbol: 'EUNL.DE',  currency: 'EUR' },
  VUSA: { symbol: 'VUSA.AS',  currency: 'EUR' },
  EIMI: { symbol: 'IS3N.DE',  currency: 'EUR' },
  AAPL: { symbol: 'AAPL',     currency: 'USD' },
  TSLA: { symbol: 'TSLA',     currency: 'USD' },
  MSFT: { symbol: 'MSFT',     currency: 'USD' },
  NVDA: { symbol: 'NVDA',     currency: 'USD' },
  AMZN: { symbol: 'AMZN',     currency: 'USD' },
  GOOGL: { symbol: 'GOOGL',   currency: 'USD' },
  META: { symbol: 'META',     currency: 'USD' },
};

interface YahooQuote {
  price: number;
  currency: string; // 'EUR', 'USD', 'GBP', 'GBp', ...
}

async function fetchYahooQuote(yahooSymbol: string): Promise<YahooQuote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OhrangeFund/1.0)' },
  });
  if (!res.ok) throw new Error(`Yahoo HTTP ${res.status} for ${yahooSymbol}`);
  const data = await res.json() as any;
  const meta = data?.chart?.result?.[0]?.meta;
  const price: unknown = meta?.regularMarketPrice;
  if (typeof price !== 'number') throw new Error(`No price data for ${yahooSymbol}`);
  return { price, currency: (meta?.currency as string) ?? 'USD' };
}

function toEurCents(price: number, currency: string, rates: { usd: number; gbp: number }): number {
  if (currency === 'EUR') return Math.round(price * 100);
  if (currency === 'USD') return Math.round((price / rates.usd) * 100);
  if (currency === 'GBP') return Math.round((price / rates.gbp) * 100);
  // GBp / GBX = pence (1/100 of GBP)
  if (currency === 'GBp' || currency === 'GBX') return Math.round((price / 100 / rates.gbp) * 100);
  // Fallback: assume USD
  return Math.round((price / rates.usd) * 100);
}

async function getCryptoPricesEurCents(tickers: string[]): Promise<Record<string, number>> {
  const ids = tickers.map((t) => COINGECKO_IDS[t]).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const data = await res.json() as Record<string, { eur: number }>;
  const result: Record<string, number> = {};
  for (const ticker of tickers) {
    const eurPrice = data[COINGECKO_IDS[ticker]]?.eur;
    if (typeof eurPrice === 'number') result[ticker] = Math.round(eurPrice * 100);
  }
  return result;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const tickersParam = (req.query?.tickers as string) ?? '';
  const tickers = tickersParam.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean);
  if (tickers.length === 0) return res.status(400).json({ error: 'Missing tickers param' });

  const cryptoTickers  = tickers.filter((t) => COINGECKO_IDS[t]);
  const mappedTickers  = tickers.filter((t) => YAHOO_SYMBOLS[t]);
  const customTickers  = tickers.filter((t) => !COINGECKO_IDS[t] && !YAHOO_SYMBOLS[t]);

  // Sempre buscar taxas de câmbio (necessárias para stocks USD e tickers arbitrários)
  const [cryptoData, eurUsd, eurGbp, mappedData, customData] = await Promise.all([
    cryptoTickers.length > 0
      ? getCryptoPricesEurCents(cryptoTickers).catch(() => ({} as Record<string, number>))
      : Promise.resolve({} as Record<string, number>),
    fetchYahooQuote('EURUSD=X').then((q) => q.price).catch(() => 1.08),
    fetchYahooQuote('EURGBP=X').then((q) => q.price).catch(() => 0.86),
    // Tickers mapeados: usamos símbolo e moeda já conhecidos
    Promise.allSettled(
      mappedTickers.map((ticker) => {
        const { symbol, currency } = YAHOO_SYMBOLS[ticker];
        return fetchYahooQuote(symbol).then((q) => ({ ticker, price: q.price, currency }));
      }),
    ),
    // Tickers arbitrários: passamos directamente ao Yahoo e detectamos a moeda
    Promise.allSettled(
      customTickers.map((ticker) =>
        fetchYahooQuote(ticker).then((q) => ({ ticker, price: q.price, currency: q.currency })),
      ),
    ),
  ]);

  const rates = { usd: eurUsd, gbp: eurGbp };
  const result: Record<string, number> = { ...cryptoData };

  for (const settled of [...mappedData, ...customData]) {
    if (settled.status !== 'fulfilled') continue;
    const { ticker, price, currency } = settled.value;
    result[ticker] = toEurCents(price, currency, rates);
  }

  return res.status(200).json(result);
}
