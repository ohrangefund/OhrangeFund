import {
  collection, doc, query, where, orderBy, limit as firestoreLimit,
  onSnapshot, runTransaction, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { Transaction } from '@/types/models';

export function subscribeToTransactionsForAnalytics(
  userId: string,
  since: Date,
  callback: (transactions: Transaction[]) => void,
): () => void {
  const q = query(
    collection(db, 'transactions'),
    where('user_id', '==', userId),
    where('date', '>=', Timestamp.fromDate(since)),
    orderBy('date', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
  });
}

/**
 * General-view subscription: merges the user's own transactions with transactions
 * from shared accounts created by other members.
 * Deduplication is handled by using the Firestore document ID as the map key.
 */
export function subscribeToGeneralTransactions(
  userId: string,
  sharedAccountIds: string[],
  limitCount: number,
  callback: (transactions: Transaction[], hasMore: boolean) => void,
  startDate?: Date,
  endDate?: Date,
): () => void {
  const dateFilters = [
    ...(startDate ? [where('date', '>=', Timestamp.fromDate(startDate))] : []),
    ...(endDate   ? [where('date', '<=', Timestamp.fromDate(endDate))]   : []),
  ];

  // One bucket per subscription; key = 'own' | accountId
  const buckets = new Map<string, Map<string, Transaction>>([
    ['own', new Map()],
    ...sharedAccountIds.map((id): [string, Map<string, Transaction>] => [id, new Map()]),
  ]);

  function notifyMerged() {
    const allMap = new Map<string, Transaction>();
    for (const bucket of buckets.values()) {
      for (const [id, tx] of bucket) allMap.set(id, tx);
    }
    const sorted = Array.from(allMap.values())
      .sort((a, b) => b.date.seconds - a.date.seconds);
    callback(sorted.slice(0, limitCount), sorted.length > limitCount);
  }

  const unsubs: Array<() => void> = [];

  // 1. Transactions created by the current user (own accounts + shared where they are the author)
  const ownQ = query(
    collection(db, 'transactions'),
    where('user_id', '==', userId),
    ...dateFilters,
    orderBy('date', 'desc'),
  );
  unsubs.push(onSnapshot(ownQ, (snap) => {
    const bucket = buckets.get('own')!;
    bucket.clear();
    snap.docs.forEach((d) => bucket.set(d.id, { id: d.id, ...d.data() } as Transaction));
    notifyMerged();
  }));

  // 2. One subscription per shared account to capture other members' transactions
  for (const accountId of sharedAccountIds) {
    const sharedQ = query(
      collection(db, 'transactions'),
      where('account_id', '==', accountId),
      ...dateFilters,
      orderBy('date', 'desc'),
    );
    unsubs.push(onSnapshot(sharedQ, (snap) => {
      const bucket = buckets.get(accountId)!;
      bucket.clear();
      snap.docs.forEach((d) => bucket.set(d.id, { id: d.id, ...d.data() } as Transaction));
      notifyMerged();
    }));
  }

  return () => unsubs.forEach((f) => f());
}

export function subscribeToTransactions(
  userId: string,
  accountId: string | null,
  limitCount: number,
  callback: (transactions: Transaction[], hasMore: boolean) => void,
  startDate?: Date,
  endDate?: Date,
  isSharedAccount?: boolean,
): () => void {
  // For shared accounts: query by account_id only — Firestore rule allows this via
  // exists(account_members/accountId_uid), which is constant across all results.
  // For personal accounts and general view: always include user_id (required for rule validation).
  const primaryFilters = isSharedAccount && accountId !== null
    ? [where('account_id', '==', accountId)]
    : [
        where('user_id', '==', userId),
        ...(accountId !== null ? [where('account_id', '==', accountId)] : []),
      ];

  const constraints = [
    ...primaryFilters,
    ...(startDate ? [where('date', '>=', Timestamp.fromDate(startDate))] : []),
    ...(endDate ? [where('date', '<=', Timestamp.fromDate(endDate))] : []),
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

