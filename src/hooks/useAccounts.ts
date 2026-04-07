import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToAccounts } from '@/api/accounts';
import type { Account } from '@/types/models';

export function useAccounts() {
  const { user } = useAuth();
  const [allOwned, setAllOwned] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeToAccounts(user.uid, (data) => {
      setAllOwned(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  // Personal accounts (non-shared)
  const personal = useMemo(() => allOwned.filter((a) => !a.is_shared), [allOwned]);
  const accounts = useMemo(() => personal.filter((a) => !a.archived), [personal]);
  const archived = useMemo(() => personal.filter((a) => a.archived), [personal]);
  const totalBalance = useMemo(
    () => accounts.filter((a) => a.show_in_general !== false).reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  );

  return { accounts, archived, totalBalance, loading };
}
