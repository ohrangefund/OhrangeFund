import {
  collection, doc, query, where, orderBy, limit as firestoreLimit,
  onSnapshot, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { Transaction } from '@/types/models';

export function subscribeToTransactions(
  userId: string,
  accountId: string | null,
  limitCount: number,
  callback: (transactions: Transaction[], hasMore: boolean) => void,
): () => void {
  const constraints = [
    where('user_id', '==', userId),
    ...(accountId !== null ? [where('account_id', '==', accountId)] : []),
    orderBy('date', 'desc'),
    firestoreLimit(limitCount + 1),
  ] as const;
  const q = query(collection(db, 'transactions'), ...constraints);
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
    callback(all.slice(0, limitCount), all.length > limitCount);
  });
}

export async function createTransaction(
  userId: string,
  data: {
    account_id: string;
    category_id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: Date;
  },
): Promise<void> {
  const accountRef = doc(db, 'accounts', data.account_id);
  const txRef = doc(collection(db, 'transactions'));

  await runTransaction(db, async (txn) => {
    const accountSnap = await txn.get(accountRef);
    const currentBalance = accountSnap.data()!.balance as number;
    const delta = data.type === 'income' ? data.amount : -data.amount;

    txn.set(txRef, {
      user_id: userId,
      account_id: data.account_id,
      category_id: data.category_id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: Timestamp.fromDate(data.date),
      source: 'manual',
      external_id: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    txn.update(accountRef, {
      balance: currentBalance + delta,
      updated_at: serverTimestamp(),
    });
  });
}

export async function updateTransaction(
  transactionId: string,
  oldAccountId: string,
  old: { type: 'income' | 'expense'; amount: number },
  newAccountId: string,
  data: {
    category_id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: Date;
  },
): Promise<void> {
  const oldAccountRef = doc(db, 'accounts', oldAccountId);
  const newAccountRef = doc(db, 'accounts', newAccountId);
  const txRef = doc(db, 'transactions', transactionId);
  const sameAccount = oldAccountId === newAccountId;

  await runTransaction(db, async (txn) => {
    // All reads before any writes
    const oldAccountSnap = await txn.get(oldAccountRef);
    const newAccountSnap = sameAccount ? oldAccountSnap : await txn.get(newAccountRef);

    const oldBalance = oldAccountSnap.data()!.balance as number;
    const revert = old.type === 'income' ? -old.amount : old.amount;
    const apply = data.type === 'income' ? data.amount : -data.amount;

    txn.update(txRef, {
      account_id: newAccountId,
      category_id: data.category_id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: Timestamp.fromDate(data.date),
      updated_at: serverTimestamp(),
    });

    if (sameAccount) {
      txn.update(oldAccountRef, {
        balance: oldBalance + revert + apply,
        updated_at: serverTimestamp(),
      });
    } else {
      const newBalance = newAccountSnap.data()!.balance as number;
      txn.update(oldAccountRef, {
        balance: oldBalance + revert,
        updated_at: serverTimestamp(),
      });
      txn.update(newAccountRef, {
        balance: newBalance + apply,
        updated_at: serverTimestamp(),
      });
    }
  });
}

export async function deleteTransaction(
  transactionId: string,
  accountId: string,
  type: 'income' | 'expense',
  amount: number,
): Promise<void> {
  const accountRef = doc(db, 'accounts', accountId);
  const txRef = doc(db, 'transactions', transactionId);

  await runTransaction(db, async (txn) => {
    const accountSnap = await txn.get(accountRef);
    const currentBalance = accountSnap.data()!.balance as number;
    const revert = type === 'income' ? -amount : amount;

    txn.delete(txRef);
    txn.update(accountRef, {
      balance: currentBalance + revert,
      updated_at: serverTimestamp(),
    });
  });
}

