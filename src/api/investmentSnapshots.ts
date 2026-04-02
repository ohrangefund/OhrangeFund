import {
  collection, query, where, orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { InvestmentSnapshot } from '@/types/models';

export function subscribeToInvestmentSnapshots(
  userId: string,
  investmentAccountId: string,
  onData: (snapshots: InvestmentSnapshot[]) => void,
): () => void {
  const q = query(
    collection(db, 'investment_snapshots'),
    where('user_id', '==', userId),
    where('investment_account_id', '==', investmentAccountId),
    orderBy('captured_at', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as InvestmentSnapshot)));
  });
}
