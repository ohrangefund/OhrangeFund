// Vercel Function: GET /api/ticker-search?q=apple
// Proxies Yahoo Finance autocomplete — retorna lista de tickers com nome, exchange e tipo.

type AssetType = 'stock' | 'etf' | 'crypto';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  const q = ((req.query?.q as string) ?? '').trim();
  if (!q) return res.status(200).json([]);

  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0&enableFuzzyQuery=false&lang=en-US`;

  try {
    const yahooRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OhrangeFund/1.0)' },
    });
    if (!yahooRes.ok) return res.status(200).json([]);

    const data = await yahooRes.json() as any;
    const quotes: any[] = data?.quotes ?? [];

    const SUPPORTED = new Set(['EQUITY', 'ETF', 'CRYPTOCURRENCY']);

    const results = quotes
      .filter((q: any) => SUPPORTED.has(q.quoteType))
      .map((q: any) => ({
        ticker:   q.symbol as string,
        name:     (q.longname ?? q.shortname ?? q.symbol) as string,
        exchange: (q.exchange ?? '') as string,
        type:     (q.quoteType === 'ETF'
          ? 'etf'
          : q.quoteType === 'CRYPTOCURRENCY'
            ? 'crypto'
            : 'stock') as AssetType,
      }))
      .slice(0, 12);

    return res.status(200).json(results);
  } catch {
    return res.status(200).json([]);
  }
}
