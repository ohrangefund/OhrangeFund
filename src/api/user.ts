import { collection, query, where, getDocs, writeBatch, deleteDoc, doc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '@/api/firebase';

const USER_COLLECTIONS = [
  'accounts',
  'categories',
  'transactions',
  'transfers',
  'scheduled_transactions',
  'scheduled_transfers',
  'bank_connections',
  'bank_accounts',
];

async function deleteCollectionForUser(userId: string, collectionName: string): Promise<void> {
  const q = query(collection(db, collectionName), where('user_id', '==', userId));
  const snap = await getDocs(q);
  if (snap.empty) return;
  for (let i = 0; i < snap.docs.length; i += 499) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 499).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function deleteUserAccount(userId: string): Promise<void> {
  await Promise.all(USER_COLLECTIONS.map((col) => deleteCollectionForUser(userId, col)));

  // account_members: apagar como owner e como membro
  const [ownerSnap, memberSnap] = await Promise.all([
    getDocs(query(collection(db, 'account_members'), where('owner_id', '==', userId))),
    getDocs(query(collection(db, 'account_members'), where('user_id', '==', userId))),
  ]);
  const memberDocs = [...ownerSnap.docs, ...memberSnap.docs];
  if (memberDocs.length > 0) {
    const batch = writeBatch(db);
    memberDocs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await deleteDoc(doc(db, 'users', userId));

  const currentUser = auth.currentUser;
  if (currentUser) await deleteUser(currentUser);
}
