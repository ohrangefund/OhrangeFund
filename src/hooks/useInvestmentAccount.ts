import { useEffect, useState } from 'react';
import { subscribeToInvestmentAccount } from '@/api/investmentAccounts';
import { useAuth } from '@/context/AuthContext';
import type { InvestmentAccount } from '@/types/models';

export function useInvestmentAccount() {
  const { user } = useAuth();
  const [account, setAccount] = useState<InvestmentAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const unsub = subscribeToInvestmentAccount(user.uid, (acc) => {
      setAccount(acc);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { account, loading };
}
