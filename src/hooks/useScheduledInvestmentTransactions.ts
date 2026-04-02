import { useEffect, useState } from 'react';
import { subscribeToScheduledInvestmentTransactions } from '@/api/scheduledInvestmentTransactions';
import { useAuth } from '@/context/AuthContext';
import type { ScheduledInvestmentTransaction } from '@/types/models';

export function useScheduledInvestmentTransactions(investmentAccountId: string | null) {
  const { user } = useAuth();
  const [items, setItems] = useState<ScheduledInvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !investmentAccountId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToScheduledInvestmentTransactions(
      user.uid,
      investmentAccountId,
      (data) => { setItems(data); setLoading(false); },
    );
    return unsub;
  }, [user, investmentAccountId]);

  return { items, loading };
}
