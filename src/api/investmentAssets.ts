import {
  collection, doc, addDoc, deleteDoc, query, where,
  onSnapshot, serverTimestamp, getDocs,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { InvestmentAsset, AssetType } from '@/types/models';

export function subscribeToInvestmentAssets(
  userId: string,
  investmentAccountId: string,
  onData: (assets: InvestmentAsset[]) => void,
): () => void {
  const q = query(
    collection(db, 'investment_assets'),
    where('user_id', '==', userId),
    where('investment_account_id', '==', investmentAccountId),
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as InvestmentAsset)));
  });
}

export async function addInvestmentAsset(
  userId: string,
  investmentAccountId: string,
  data: { ticker: string; name: string; type: AssetType },
): Promise<string> {
  // Idempotent: don't add duplicate tickers
  const q = query(
    collection(db, 'investment_assets'),
    where('user_id', '==', userId),
    where('investment_account_id', '==', investmentAccountId),
    where('ticker', '==', data.ticker),
  );
  const existing = await getDocs(q);
  if (!existing.empty) return existing.docs[0].id;

  const ref = await addDoc(collection(db, 'investment_assets'), {
    user_id: userId,
    investment_account_id: investmentAccountId,
    ticker: data.ticker,
    name: data.name,
    type: data.type,
    quantity: 0,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteInvestmentAsset(assetId: string): Promise<void> {
  await deleteDoc(doc(db, 'investment_assets', assetId));
}

export function getAssetRef(assetId: string) {
  return doc(db, 'investment_assets', assetId);
}
