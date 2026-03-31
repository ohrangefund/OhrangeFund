import {
  collection, doc, query, where, orderBy, limit as firestoreLimit,
  onSnapshot, runTransaction, serverTimestamp, getDocs, Timestamp,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { Transaction } from '@/types/models';

export function subscribeToTransactions(
  userId: string,
  accountId: string,
  limitCount: number,
  callback: (transactions: Transaction[], hasMore: boolean) => void,
): () => void {
  const q = query(
    collection(db, 'transactions'),
    where('user_id', '==', userId),
    where('account_id', '==', accountId),
    orderBy('date', 'desc'),
    firestoreLimit(limitCount + 1),
  );
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
  accountId: string,
  old: { type: 'income' | 'expense'; amount: number },
  data: {
    category_id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    date: Date;
  },
): Promise<void> {
  const accountRef = doc(db, 'accounts', accountId);
  const txRef = doc(db, 'transactions', transactionId);

  await runTransaction(db, async (txn) => {
    const accountSnap = await txn.get(accountRef);
    const currentBalance = accountSnap.data()!.balance as number;
    const revert = old.type === 'income' ? -old.amount : old.amount;
    const apply = data.type === 'income' ? data.amount : -data.amount;

    txn.update(txRef, {
      category_id: data.category_id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: Timestamp.fromDate(data.date),
      updated_at: serverTimestamp(),
    });

    txn.update(accountRef, {
      balance: currentBalance + revert + apply,
      updated_at: serverTimestamp(),
    });
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

export async function hasTransactionsForCategory(categoryId: string): Promise<boolean> {
  const q = query(
    collection(db, 'transactions'),
    where('category_id', '==', categoryId),
    firestoreLimit(1),
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
