import {
  collection, doc, addDoc, query, where,
  onSnapshot, serverTimestamp, getDocs,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { InvestmentAccount } from '@/types/models';

export function subscribeToInvestmentAccount(
  userId: string,
  onData: (account: InvestmentAccount | null) => void,
): () => void {
  const q = query(
    collection(db, 'investment_accounts'),
    where('user_id', '==', userId),
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) { onData(null); return; }
    const d = snap.docs[0];
    onData({ id: d.id, ...d.data() } as InvestmentAccount);
  });
}

export async function createInvestmentAccount(userId: string): Promise<string> {
  // Idempotent: only create if one doesn't exist yet
  const q = query(
    collection(db, 'investment_accounts'),
    where('user_id', '==', userId),
  );
  const existing = await getDocs(q);
  if (!existing.empty) return existing.docs[0].id;

  const ref = await addDoc(collection(db, 'investment_accounts'), {
    user_id: userId,
    created_at: serverTimestamp(),
  });
  return ref.id;
}

export async function getOrCreateInvestmentAccount(
  userId: string,
): Promise<string> {
  return createInvestmentAccount(userId);
}
