import {
  collection, doc, query, where, orderBy, limit as firestoreLimit,
  onSnapshot, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { Transfer } from '@/types/models';

export function subscribeToTransfers(
  userId: string,
  accountId: string,
  limitCount: number,
  callback: (transfers: Transfer[], hasMore: boolean) => void,
): () => void {
  const q = query(
    collection(db, 'transfers'),
    where('user_id', '==', userId),
    where('account_ids', 'array-contains', accountId),
    orderBy('date', 'desc'),
    firestoreLimit(limitCount + 1),
  );
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transfer));
    callback(all.slice(0, limitCount), all.length > limitCount);
  });
}

export async function createTransfer(
  userId: string,
  data: {
    from_account_id: string;
    to_account_id: string;
    amount: number;
    description: string;
    date: Date;
  },
): Promise<void> {
  const fromRef = doc(db, 'accounts', data.from_account_id);
  const toRef = doc(db, 'accounts', data.to_account_id);
  const transferRef = doc(collection(db, 'transfers'));

  await runTransaction(db, async (txn) => {
    const fromSnap = await txn.get(fromRef);
    const toSnap = await txn.get(toRef);
    const fromBalance = fromSnap.data()!.balance as number;
    const toBalance = toSnap.data()!.balance as number;

    txn.set(transferRef, {
      user_id: userId,
      from_account_id: data.from_account_id,
      to_account_id: data.to_account_id,
      account_ids: [data.from_account_id, data.to_account_id],
      amount: data.amount,
      description: data.description,
      date: Timestamp.fromDate(data.date),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    txn.update(fromRef, { balance: fromBalance - data.amount, updated_at: serverTimestamp() });
    txn.update(toRef, { balance: toBalance + data.amount, updated_at: serverTimestamp() });
  });
}

export async function updateTransfer(
  transferId: string,
  old: { from_account_id: string; to_account_id: string; amount: number },
  data: { amount: number; description: string; date: Date },
): Promise<void> {
  const fromRef = doc(db, 'accounts', old.from_account_id);
  const toRef = doc(db, 'accounts', old.to_account_id);
  const transferRef = doc(db, 'transfers', transferId);

  await runTransaction(db, async (txn) => {
    const fromSnap = await txn.get(fromRef);
    const toSnap = await txn.get(toRef);
    const fromBalance = fromSnap.data()!.balance as number;
    const toBalance = toSnap.data()!.balance as number;

    txn.update(transferRef, {
      amount: data.amount,
      description: data.description,
      date: Timestamp.fromDate(data.date),
      updated_at: serverTimestamp(),
    });

    txn.update(fromRef, { balance: fromBalance + old.amount - data.amount, updated_at: serverTimestamp() });
    txn.update(toRef, { balance: toBalance - old.amount + data.amount, updated_at: serverTimestamp() });
  });
}

export async function deleteTransfer(
  transferId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
): Promise<void> {
  const fromRef = doc(db, 'accounts', fromAccountId);
  const toRef = doc(db, 'accounts', toAccountId);
  const transferRef = doc(db, 'transfers', transferId);

  await runTransaction(db, async (txn) => {
    const fromSnap = await txn.get(fromRef);
    const toSnap = await txn.get(toRef);
    const fromBalance = fromSnap.data()!.balance as number;
    const toBalance = toSnap.data()!.balance as number;

    txn.delete(transferRef);
    txn.update(fromRef, { balance: fromBalance + amount, updated_at: serverTimestamp() });
    txn.update(toRef, { balance: toBalance - amount, updated_at: serverTimestamp() });
  });
}
