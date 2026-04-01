import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToAccounts } from '@/api/accounts';
import type { Account } from '@/types/models';

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeToAccounts(user.uid, (data) => {
      setAccounts(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const active = useMemo(() => accounts.filter((a) => !a.archived), [accounts]);
  const archived = useMemo(() => accounts.filter((a) => a.archived), [accounts]);
  const totalBalance = useMemo(
    () => active.filter((a) => a.show_in_general !== false).reduce((sum, a) => sum + a.balance, 0),
    [active],
  );

  return { accounts: active, archived, totalBalance, loading };
}
