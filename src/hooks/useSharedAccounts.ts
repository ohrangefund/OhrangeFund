import { useEffect, useMemo, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/api/firebase';
import { subscribeToSharedAccounts } from '@/api/accountMembers';
import type { Account } from '@/types/models';
import type { SharedAccountEntry } from '@/api/accountMembers';

export function useSharedAccounts() {
  const { user } = useAuth();

  // Owned shared accounts (is_shared: true)
  const [ownedShared, setOwnedShared] = useState<Account[]>([]);
  const [ownedLoading, setOwnedLoading] = useState(true);

  // Accounts the user is a member of (via account_members)
  const [memberEntries, setMemberEntries] = useState<SharedAccountEntry[]>([]);
  const [memberLoading, setMemberLoading] = useState(true);

  useEffect(() => {
    if (!user) { setOwnedShared([]); setOwnedLoading(false); return; }
    setOwnedLoading(true);
    const q = query(collection(db, 'accounts'), where('user_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const shared = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Account))
        .filter((a) => a.is_shared && !a.archived);
      setOwnedShared(shared);
      setOwnedLoading(false);
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) { setMemberEntries([]); setMemberLoading(false); return; }
    setMemberLoading(true);
    const unsubscribe = subscribeToSharedAccounts(user.uid, (entries) => {
      setMemberEntries(entries);
      setMemberLoading(false);
    });
    return unsubscribe;
  }, [user]);

  // All accounts shared with this user (all members have full access)
  const memberAccounts = useMemo(
    () => memberEntries.map((e) => e.account),
    [memberEntries],
  );

  const loading = ownedLoading || memberLoading;

  return { ownedShared, memberEntries, memberAccounts, loading };
}
