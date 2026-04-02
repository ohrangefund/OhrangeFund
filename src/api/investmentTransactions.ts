import {
  collection, doc, query, where, orderBy, limit as firestoreLimit,
  onSnapshot, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import { getAssetPrice, getAssetPrices } from '@/api/investmentPrices';
import type { InvestmentTransaction, InvestmentAsset, InvestmentSnapshot } from '@/types/models';

const PAGE_SIZE = 20;

export function subscribeToInvestmentTransactions(
  userId: string,
  investmentAccountId: string,
  limitCount: number,
  onData: (txns: InvestmentTransaction[], hasMore: boolean) => void,
): () => void {
  const q = query(
    collection(db, 'investment_transactions'),
    where('user_id', '==', userId),
    where('investment_account_id', '==', investmentAccountId),
    orderBy('date', 'desc'),
    firestoreLimit(limitCount + 1),
  );
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as InvestmentTransaction));
    onData(all.slice(0, limitCount), all.length > limitCount);
  });
}

/** Buy: debit regular account, increase asset quantity, create transaction + snapshot. */
export async function buyAsset(
  userId: string,
  investmentAccountId: string,
  data: {
    asset_id: string;
    ticker: string;
    account_id: string;
    amount: number;      // cents to spend
    date: Date;
    description: string | null;
  },
  /** All assets in the portfolio (to compute snapshot total) */
  allAssets: InvestmentAsset[],
): Promise<void> {
  const pricePerUnit = await getAssetPrice(data.ticker);
  const quantity = data.amount / pricePerUnit;

  const accountRef = doc(db, 'accounts', data.account_id);
  const assetRef   = doc(db, 'investment_assets', data.asset_id);
  const txnRef     = doc(collection(db, 'investment_transactions'));
  const snapRef    = doc(collection(db, 'investment_snapshots'));

  // Pre-fetch prices for all portfolio assets to compute snapshot
  const otherTickers = allAssets
    .filter((a) => a.id !== data.asset_id)
    .map((a) => a.ticker);
  const otherPrices = otherTickers.length
    ? await getAssetPrices(otherTickers)
    : {};

  await runTransaction(db, async (txn) => {
    const accountSnap = await txn.get(accountRef);
    const assetSnap   = await txn.get(assetRef);

    if (!accountSnap.exists() || !assetSnap.exists()) {
      throw new Error('Account or asset not found');
    }

    const currentBalance  = accountSnap.data().balance as number;
    const currentQuantity = assetSnap.data().quantity as number;
    const newQuantity     = currentQuantity + quantity;

    // Compute new portfolio total value
    const portfolioValue = allAssets.reduce((sum, a) => {
      const q = a.id === data.asset_id ? newQuantity : (a.quantity ?? 0);
      const p = a.id === data.asset_id ? pricePerUnit : (otherPrices[a.ticker] ?? 0);
      return sum + q * p;
    }, 0);

    // Debit regular account
    txn.update(accountRef, {
      balance: currentBalance - data.amount,
      updated_at: serverTimestamp(),
    });

    // Update asset quantity
    txn.update(assetRef, { quantity: newQuantity });

    // Record investment transaction
    txn.set(txnRef, {
      user_id: userId,
      investment_account_id: investmentAccountId,
      asset_id: data.asset_id,
      account_id: data.account_id,
      type: 'buy',
      amount: data.amount,
      quantity,
      price_per_unit: pricePerUnit,
      description: data.description ?? null,
      date: Timestamp.fromDate(data.date),
      created_at: serverTimestamp(),
    });

    // Snapshot
    txn.set(snapRef, {
      user_id: userId,
      investment_account_id: investmentAccountId,
      total_value: Math.round(portfolioValue),
      trigger: 'buy',
      captured_at: serverTimestamp(),
    });
  });
}

/** Sell: credit regular account, decrease asset quantity, create transaction + snapshot. */
export async function sellAsset(
  userId: string,
  investmentAccountId: string,
  data: {
    asset_id: string;
    ticker: string;
    account_id: string;
    amount: number;      // cents to receive
    date: Date;
    description: string | null;
  },
  allAssets: InvestmentAsset[],
): Promise<void> {
  const pricePerUnit = await getAssetPrice(data.ticker);
  const quantity = data.amount / pricePerUnit;

  const accountRef = doc(db, 'accounts', data.account_id);
  const assetRef   = doc(db, 'investment_assets', data.asset_id);
  const txnRef     = doc(collection(db, 'investment_transactions'));
  const snapRef    = doc(collection(db, 'investment_snapshots'));

  const otherTickers = allAssets
    .filter((a) => a.id !== data.asset_id)
    .map((a) => a.ticker);
  const otherPrices = otherTickers.length
    ? await getAssetPrices(otherTickers)
    : {};

  await runTransaction(db, async (txn) => {
    const accountSnap = await txn.get(accountRef);
    const assetSnap   = await txn.get(assetRef);

    if (!accountSnap.exists() || !assetSnap.exists()) {
      throw new Error('Account or asset not found');
    }

    const currentBalance  = accountSnap.data().balance as number;
    const currentQuantity = assetSnap.data().quantity as number;

    if (quantity > currentQuantity + 1e-9) {
      throw new Error('INSUFFICIENT_QUANTITY');
    }

    const newQuantity = Math.max(0, currentQuantity - quantity);

    const portfolioValue = allAssets.reduce((sum, a) => {
      const q = a.id === data.asset_id ? newQuantity : (a.quantity ?? 0);
      const p = a.id === data.asset_id ? pricePerUnit : (otherPrices[a.ticker] ?? 0);
      return sum + q * p;
    }, 0);

    // Credit regular account
    txn.update(accountRef, {
      balance: currentBalance + data.amount,
      updated_at: serverTimestamp(),
    });

    // Update asset quantity
    txn.update(assetRef, { quantity: newQuantity });

    // Record investment transaction
    txn.set(txnRef, {
      user_id: userId,
      investment_account_id: investmentAccountId,
      asset_id: data.asset_id,
      account_id: data.account_id,
      type: 'sell',
      amount: data.amount,
      quantity,
      price_per_unit: pricePerUnit,
      description: data.description ?? null,
      date: Timestamp.fromDate(data.date),
      created_at: serverTimestamp(),
    });

    // Snapshot
    txn.set(snapRef, {
      user_id: userId,
      investment_account_id: investmentAccountId,
      total_value: Math.round(portfolioValue),
      trigger: 'sell',
      captured_at: serverTimestamp(),
    });
  });
}
