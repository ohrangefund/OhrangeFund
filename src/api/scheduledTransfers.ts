import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { ScheduledTransfer, Recurrence } from '@/types/models';

export function subscribeToScheduledTransfers(
  userId: string,
  onData: (items: ScheduledTransfer[]) => void,
): () => void {
  const q = query(
    collection(db, 'scheduled_transfers'),
    where('user_id', '==', userId),
    orderBy('next_date', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduledTransfer)));
  });
}

export async function createScheduledTransfer(
  userId: string,
  data: {
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description: string;
    recurrence: Recurrence;
    next_date: Date;
    end_date: Date | null;
  },
): Promise<void> {
  await addDoc(collection(db, 'scheduled_transfers'), {
    user_id: userId,
    from_account_id: data.from_account_id,
    to_account_id: data.to_account_id,
    amount: data.amount,
    description: data.description,
    recurrence: data.recurrence,
    next_date: Timestamp.fromDate(data.next_date),
    end_date: data.end_date ? Timestamp.fromDate(data.end_date) : null,
    created_at: serverTimestamp(),
  });
}

export async function updateScheduledTransfer(
  id: string,
  data: {
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description: string;
    recurrence: Recurrence;
    next_date: Date;
    end_date: Date | null;
  },
): Promise<void> {
  await updateDoc(doc(db, 'scheduled_transfers', id), {
    from_account_id: data.from_account_id,
    to_account_id: data.to_account_id,
    amount: data.amount,
    description: data.description,
    recurrence: data.recurrence,
    next_date: Timestamp.fromDate(data.next_date),
    end_date: data.end_date ? Timestamp.fromDate(data.end_date) : null,
  });
}

export async function deleteScheduledTransfer(id: string): Promise<void> {
  await deleteDoc(doc(db, 'scheduled_transfers', id));
}
