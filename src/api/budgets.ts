import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { Budget } from '@/types/models';

export function subscribeToBudgets(
  userId: string,
  onData: (budgets: Budget[]) => void,
): () => void {
  const q = query(collection(db, 'budgets'), where('user_id', '==', userId));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget)));
  });
}

export async function createBudget(
  userId: string,
  data: { category_id: string; amount_limit: number },
): Promise<void> {
  await addDoc(collection(db, 'budgets'), {
    user_id: userId,
    category_id: data.category_id,
    amount_limit: data.amount_limit,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

export async function updateBudget(
  budgetId: string,
  amount_limit: number,
): Promise<void> {
  await updateDoc(doc(db, 'budgets', budgetId), {
    amount_limit,
    updated_at: serverTimestamp(),
  });
}

export async function deleteBudget(budgetId: string): Promise<void> {
  await deleteDoc(doc(db, 'budgets', budgetId));
}
