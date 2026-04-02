import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { ScheduledInvestmentTransaction, Recurrence } from '@/types/models';

export function subscribeToScheduledInvestmentTransactions(
  userId: string,
  investmentAccountId: string,
  onData: (items: ScheduledInvestmentTransaction[]) => void,
): () => void {
  const q = query(
    collection(db, 'scheduled_investment_transactions'),
    where('user_id', '==', userId),
    where('investment_account_id', '==', investmentAccountId),
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduledInvestmentTransaction)));
  });
}

export async function createScheduledInvestmentTransaction(
  userId: string,
  data: {
    investment_account_id: string;
    asset_id: string;
    account_id: string;
    type: 'buy' | 'sell';
    amount: number;
    recurrence: Recurrence;
    next_date: Date;
    end_date: Date | null;
    description: string | null;
  },
): Promise<void> {
  await addDoc(collection(db, 'scheduled_investment_transactions'), {
    user_id: userId,
    investment_account_id: data.investment_account_id,
    asset_id: data.asset_id,
    account_id: data.account_id,
    type: data.type,
    amount: data.amount,
    recurrence: data.recurrence,
    next_date: Timestamp.fromDate(data.next_date),
    end_date: data.end_date ? Timestamp.fromDate(data.end_date) : null,
    description: data.description ?? null,
    created_at: serverTimestamp(),
  });
}

export async function updateScheduledInvestmentTransaction(
  id: string,
  data: {
    asset_id: string;
    account_id: string;
    type: 'buy' | 'sell';
    amount: number;
    recurrence: Recurrence;
    next_date: Date;
    end_date: Date | null;
    description: string | null;
  },
): Promise<void> {
  await updateDoc(doc(db, 'scheduled_investment_transactions', id), {
    asset_id: data.asset_id,
    account_id: data.account_id,
    type: data.type,
    amount: data.amount,
    recurrence: data.recurrence,
    next_date: Timestamp.fromDate(data.next_date),
    end_date: data.end_date ? Timestamp.fromDate(data.end_date) : null,
    description: data.description ?? null,
  });
}

export async function deleteScheduledInvestmentTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, 'scheduled_investment_transactions', id));
}
