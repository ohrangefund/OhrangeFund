import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { ScheduledTransaction, Recurrence } from '@/types/models';

export function subscribeToScheduledTransactions(
  userId: string,
  onData: (items: ScheduledTransaction[]) => void,
): () => void {
  const q = query(
    collection(db, 'scheduled_transactions'),
    where('user_id', '==', userId),
    orderBy('next_date', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduledTransaction)));
  });
}

export async function createScheduledTransaction(
  userId: string,
  data: {
    account_id: string;
    category_id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    recurrence: Recurrence;
    next_date: Date;
    end_date: Date | null;
  },
): Promise<void> {
  await addDoc(collection(db, 'scheduled_transactions'), {
    user_id: userId,
    account_id: data.account_id,
    category_id: data.category_id,
    type: data.type,
    amount: data.amount,
    description: data.description,
    recurrence: data.recurrence,
    next_date: Timestamp.fromDate(data.next_date),
    end_date: data.end_date ? Timestamp.fromDate(data.end_date) : null,
    created_at: serverTimestamp(),
  });
}

export async function updateScheduledTransaction(
  id: string,
  data: {
    account_id: string;
    category_id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    recurrence: Recurrence;
    next_date: Date;
    end_date: Date | null;
  },
): Promise<void> {
  await updateDoc(doc(db, 'scheduled_transactions', id), {
    account_id: data.account_id,
    category_id: data.category_id,
    type: data.type,
    amount: data.amount,
    description: data.description,
    recurrence: data.recurrence,
    next_date: Timestamp.fromDate(data.next_date),
    end_date: data.end_date ? Timestamp.fromDate(data.end_date) : null,
  });
}

export async function deleteScheduledTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, 'scheduled_transactions', id));
}
