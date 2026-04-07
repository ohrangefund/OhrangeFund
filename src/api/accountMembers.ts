import {
  collection, doc, updateDoc, deleteDoc,
  query, where, onSnapshot, getDoc,
} from 'firebase/firestore';
import { getIdToken } from 'firebase/auth';
import { db, auth } from '@/api/firebase';
import type { Account, AccountMember } from '@/types/models';

export type SharedAccountEntry = {
  account: Account;
  memberId: string;
  ownerEmail: string;
};

// Owner: subscribe to members of a specific account
export function subscribeToAccountMembers(
  accountId: string,
  onData: (members: AccountMember[]) => void,
): () => void {
  const q = query(
    collection(db, 'account_members'),
    where('account_id', '==', accountId),
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AccountMember)));
  });
}

// Member: subscribe to accounts shared with this user
export function subscribeToSharedAccounts(
  userId: string,
  onData: (entries: SharedAccountEntry[]) => void,
): () => void {
  const q = query(
    collection(db, 'account_members'),
    where('user_id', '==', userId),
  );
  return onSnapshot(q, async (snap) => {
    const memberships = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as AccountMember))
      // docs sem status são anteriores à feature de pending — tratar como accepted
      .filter((m) => !m.status || m.status === 'accepted');
    if (memberships.length === 0) { onData([]); return; }

    const accountDocs = await Promise.all(
      memberships.map((m) => getDoc(doc(db, 'accounts', m.account_id))),
    );

    const entries: SharedAccountEntry[] = [];
    accountDocs.forEach((accountSnap, i) => {
      if (accountSnap.exists()) {
        entries.push({
          account: { id: accountSnap.id, ...accountSnap.data() } as Account,
          memberId: memberships[i].id,
          ownerEmail: memberships[i].owner_email ?? '',
        });
      }
    });
    onData(entries);
  });
}

export async function removeMember(memberId: string): Promise<void> {
  await deleteDoc(doc(db, 'account_members', memberId));
}

// Invitee: subscribe to pending invitations
export function subscribeToPendingInvites(
  userId: string,
  onData: (invites: AccountMember[]) => void,
): () => void {
  const q = query(
    collection(db, 'account_members'),
    where('user_id', '==', userId),
  );
  return onSnapshot(q, (snap) => {
    const pending = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as AccountMember))
      .filter((m) => m.status === 'pending');
    onData(pending);
  });
}

// Invitee accepts a pending invitation
export async function acceptInvite(memberId: string): Promise<void> {
  await updateDoc(doc(db, 'account_members', memberId), { status: 'accepted' });
}

// Call the Vercel Function to invite a member (requires Firebase Admin for email lookup)
export async function inviteMember(
  accountId: string,
  inviteeEmail: string,
): Promise<void> {
  const token = await getIdToken(auth.currentUser!);
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const res = await fetch(`${baseUrl}/api/invite-member`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ accountId, inviteeEmail }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'UNKNOWN');
  }
}
