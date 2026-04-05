import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

type Recurrence = 'once' | 'weekly' | 'monthly' | 'yearly';

function calcNextDate(current: Date, recurrence: Recurrence): Date {
  const next = new Date(current);
  if (recurrence === 'weekly') next.setDate(next.getDate() + 7);
  if (recurrence === 'monthly') next.setMonth(next.getMonth() + 1);
  if (recurrence === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

async function processScheduledTransactions(now: admin.firestore.Timestamp): Promise<number> {
  const snap = await db.collection('scheduled_transactions')
    .where('next_date', '<=', now)
    .get();

  let processed = 0;

  for (const schedDoc of snap.docs) {
    const sched = schedDoc.data();
    try {
      await db.runTransaction(async (txn) => {
        const accountRef = db.collection('accounts').doc(sched.account_id);
        const accountSnap = await txn.get(accountRef);
        if (!accountSnap.exists) return;

        const currentBalance = accountSnap.data()!.balance as number;
        const delta = sched.type === 'income' ? sched.amount : -sched.amount;

        // Create the real transaction
        const txRef = db.collection('transactions').doc();
        txn.set(txRef, {
          user_id: sched.user_id,
          account_id: sched.account_id,
          category_id: sched.category_id,
          type: sched.type,
          amount: sched.amount,
          description: sched.description,
          date: sched.next_date,
          source: 'manual',
          external_id: null,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update account balance
        txn.update(accountRef, {
          balance: currentBalance + delta,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update or delete the scheduled item
        if (sched.recurrence === 'once') {
          txn.delete(schedDoc.ref);
        } else {
          const nextDate = calcNextDate(sched.next_date.toDate(), sched.recurrence as Recurrence);
          const nextTimestamp = admin.firestore.Timestamp.fromDate(nextDate);
          const expired = sched.end_date && nextTimestamp > sched.end_date;
          if (expired) {
            txn.delete(schedDoc.ref);
          } else {
            txn.update(schedDoc.ref, { next_date: nextTimestamp });
          }
        }
      });
      processed++;
    } catch (err) {
      console.error(`Failed to process scheduled_transaction ${schedDoc.id}:`, err);
    }
  }

  return processed;
}

async function processScheduledTransfers(now: admin.firestore.Timestamp): Promise<number> {
  const snap = await db.collection('scheduled_transfers')
    .where('next_date', '<=', now)
    .get();

  let processed = 0;

  for (const schedDoc of snap.docs) {
    const sched = schedDoc.data();
    try {
      await db.runTransaction(async (txn) => {
        const fromRef = db.collection('accounts').doc(sched.from_account_id);
        const toRef = db.collection('accounts').doc(sched.to_account_id);
        const fromSnap = await txn.get(fromRef);
        const toSnap = await txn.get(toRef);
        if (!fromSnap.exists || !toSnap.exists) return;

        const fromBalance = fromSnap.data()!.balance as number;
        const toBalance = toSnap.data()!.balance as number;

        // Create the real transfer
        const transferRef = db.collection('transfers').doc();
        txn.set(transferRef, {
          user_id: sched.user_id,
          from_account_id: sched.from_account_id,
          to_account_id: sched.to_account_id,
          account_ids: [sched.from_account_id, sched.to_account_id],
          amount: sched.amount,
          description: sched.description,
          date: sched.next_date,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update both balances
        txn.update(fromRef, {
          balance: fromBalance - sched.amount,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        txn.update(toRef, {
          balance: toBalance + sched.amount,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update or delete the scheduled item
        if (sched.recurrence === 'once') {
          txn.delete(schedDoc.ref);
        } else {
          const nextDate = calcNextDate(sched.next_date.toDate(), sched.recurrence as Recurrence);
          const nextTimestamp = admin.firestore.Timestamp.fromDate(nextDate);
          const expired = sched.end_date && nextTimestamp > sched.end_date;
          if (expired) {
            txn.delete(schedDoc.ref);
          } else {
            txn.update(schedDoc.ref, { next_date: nextTimestamp });
          }
        }
      });
      processed++;
    } catch (err) {
      console.error(`Failed to process scheduled_transfer ${schedDoc.id}:`, err);
    }
  }

  return processed;
}

// ─── Price fetching (calls the deployed /api/prices Vercel Function) ──────────
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

const MOCK_PRICES_CENTS: Record<string, number> = {
  VWCE: 11423, CSPX: 55120, IWDA: 9870, VUSA: 10245, EIMI: 3318,
  AAPL: 21890, TSLA: 18750, MSFT: 42300, NVDA: 87600, AMZN: 20100,
  GOOGL: 17850, META: 55900,
  BTC: 8_245_000, ETH: 313_500, SOL: 14_800,
};

async function fetchPrices(tickers: string[]): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};
  if (!API_BASE) {
    return Object.fromEntries(tickers.map((t) => [t, MOCK_PRICES_CENTS[t] ?? 0]));
  }
  const q = tickers.join(',');
  const res = await fetch(`${API_BASE}/api/prices?tickers=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Prices API HTTP ${res.status}`);
  return res.json() as Promise<Record<string, number>>;
}

async function processScheduledInvestmentTransactions(
  now: admin.firestore.Timestamp,
): Promise<number> {
  const snap = await db.collection('scheduled_investment_transactions')
    .where('next_date', '<=', now)
    .get();

  let processed = 0;

  for (const schedDoc of snap.docs) {
    const sched = schedDoc.data();
    try {
      // Read ticker from asset document (outside transaction — read-only)
      const assetDocPre = await db.collection('investment_assets').doc(sched.asset_id).get();
      if (!assetDocPre.exists) continue;
      const ticker = assetDocPre.data()!.ticker as string;
      const prices = await fetchPrices([ticker]);
      const pricePerUnit = prices[ticker] ?? 0;
      if (pricePerUnit === 0) throw new Error(`No price for ticker ${ticker}`);

      await db.runTransaction(async (txn) => {
        const assetRef   = db.collection('investment_assets').doc(sched.asset_id);
        const accountRef = db.collection('accounts').doc(sched.account_id);
        const assetSnap   = await txn.get(assetRef);
        const accountSnap = await txn.get(accountRef);
        if (!assetSnap.exists || !accountSnap.exists) return;

        const currentQty     = assetSnap.data()!.quantity as number;
        const currentBalance = accountSnap.data()!.balance as number;
        const quantity       = sched.amount / pricePerUnit;

        if (sched.type === 'sell' && quantity > currentQty + 1e-9) {
          console.warn(`Skipping sell — insufficient quantity for asset ${sched.asset_id}`);
          return;
        }

        const newQty = sched.type === 'buy'
          ? currentQty + quantity
          : Math.max(0, currentQty - quantity);

        const newBalance = sched.type === 'buy'
          ? currentBalance - sched.amount
          : currentBalance + sched.amount;

        // Create investment_transaction
        const txnRef = db.collection('investment_transactions').doc();
        txn.set(txnRef, {
          user_id: sched.user_id,
          investment_account_id: sched.investment_account_id,
          asset_id: sched.asset_id,
          account_id: sched.account_id,
          type: sched.type,
          amount: sched.amount,
          quantity,
          price_per_unit: pricePerUnit,
          description: sched.description ?? null,
          date: sched.next_date,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Snapshot (simplified — single asset value for cron)
        const snapRef = db.collection('investment_snapshots').doc();
        txn.set(snapRef, {
          user_id: sched.user_id,
          investment_account_id: sched.investment_account_id,
          total_value: Math.round(newQty * pricePerUnit),
          trigger: 'cron',
          captured_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        txn.update(assetRef, { quantity: newQty });
        txn.update(accountRef, {
          balance: newBalance,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Advance or delete scheduled item
        if (sched.recurrence === 'once') {
          txn.delete(schedDoc.ref);
        } else {
          const nextDate = calcNextDate(sched.next_date.toDate(), sched.recurrence as Recurrence);
          const nextTimestamp = admin.firestore.Timestamp.fromDate(nextDate);
          const expired = sched.end_date && nextTimestamp > sched.end_date;
          if (expired) {
            txn.delete(schedDoc.ref);
          } else {
            txn.update(schedDoc.ref, { next_date: nextTimestamp });
          }
        }
      });

      processed++;
    } catch (err) {
      console.error(`Failed to process scheduled_investment_transaction ${schedDoc.id}:`, err);
    }
  }

  return processed;
}

// ─── Daily investment snapshots ───────────────────────────────────────────────
async function processInvestmentSnapshots(): Promise<number> {
  const assetsSnap = await db.collection('investment_assets').get();
  if (assetsSnap.empty) return 0;

  // Group assets by investment_account_id
  type AssetRow = { user_id: string; investment_account_id: string; ticker: string; quantity: number };
  const byAccount = new Map<string, AssetRow[]>();
  for (const d of assetsSnap.docs) {
    const data = d.data() as AssetRow;
    const key = data.investment_account_id;
    if (!byAccount.has(key)) byAccount.set(key, []);
    byAccount.get(key)!.push(data);
  }

  // Batch-fetch prices for every unique ticker across all accounts
  const allTickers = [...new Set(assetsSnap.docs.map((d) => d.data().ticker as string))];
  const prices = await fetchPrices(allTickers);

  // Write one snapshot per account with a non-zero portfolio value
  const batch = db.batch();
  let count = 0;
  for (const [investmentAccountId, assets] of byAccount) {
    const totalValue = Math.round(
      assets.reduce((sum, a) => sum + a.quantity * (prices[a.ticker] ?? 0), 0),
    );
    if (totalValue === 0) continue;

    const snapRef = db.collection('investment_snapshots').doc();
    batch.set(snapRef, {
      user_id: assets[0].user_id,
      investment_account_id: investmentAccountId,
      total_value: totalValue,
      trigger: 'daily',
      captured_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    count++;
  }

  if (count > 0) await batch.commit();
  return count;
}

export default async function handler(req: any, res: any) {
  // Verify this is a legitimate cron invocation from Vercel
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = admin.firestore.Timestamp.now();
    const [transactions, transfers, investments, snapshots] = await Promise.all([
      processScheduledTransactions(now),
      processScheduledTransfers(now),
      processScheduledInvestmentTransactions(now),
      processInvestmentSnapshots(),
    ]);
    console.log(`Cron completed: ${transactions} transactions, ${transfers} transfers, ${investments} investments, ${snapshots} portfolio snapshots.`);
    return res.status(200).json({ ok: true, transactions, transfers, investments, snapshots });
  } catch (err) {
    console.error('Cron fatal error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
