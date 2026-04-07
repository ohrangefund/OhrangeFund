import {
  collection, doc, addDoc, updateDoc,
  serverTimestamp, query, where, onSnapshot,
} from 'firebase/firestore';
import { db } from '@/api/firebase';
import type { Account } from '@/types/models';

export function subscribeToAccounts(
  userId: string,
  onData: (accounts: Account[]) => void,
): () => void {
  const q = query(collection(db, 'accounts'), where('user_id', '==', userId));
  return onSnapshot(q, (snap) => {
    const accounts = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Account));
    onData(accounts);
  });
}

export async function createAccount(
  userId: string,
  data: { name: string; balance: number; color: string; icon: string },
): Promise<void> {
  await addDoc(collection(db, 'accounts'), {
    user_id: userId,
    name: data.name,
    balance: data.balance,
    color: data.color,
    icon: data.icon,
    archived: false,
    show_in_general: true,
    bank_account_id: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

export async function updateAccount(
  accountId: string,
  data: Partial<Pick<Account, 'name' | 'color' | 'icon' | 'show_in_general'>>,
): Promise<void> {
  await updateDoc(doc(db, 'accounts', accountId), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

export async function archiveAccount(accountId: string, archived: boolean): Promise<void> {
  await updateDoc(doc(db, 'accounts', accountId), {
    archived,
    updated_at: serverTimestamp(),
  });
}

export async function createSharedAccount(
  userId: string,
  data: { name: string; balance: number; color: string; icon: string; show_in_general: boolean },
): Promise<string> {
  const ref = await addDoc(collection(db, 'accounts'), {
    user_id: userId,
    name: data.name,
    balance: data.balance,
    color: data.color,
    icon: data.icon,
    archived: false,
    show_in_general: data.show_in_general,
    is_shared: true,
    bank_account_id: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return ref.id;
}

