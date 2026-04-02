import { useEffect, useState, useCallback } from 'react';
import { subscribeToInvestmentTransactions } from '@/api/investmentTransactions';
import { useAuth } from '@/context/AuthContext';
import type { InvestmentTransaction } from '@/types/models';

const PAGE_SIZE = 20;

export function useInvestmentTransactions(investmentAccountId: string | null) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<InvestmentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [limitCount, setLimitCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!user || !investmentAccountId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToInvestmentTransactions(
      user.uid,
      investmentAccountId,
      limitCount,
      (data, more) => { setTransactions(data); setHasMore(more); setLoading(false); },
    );
    return unsub;
  }, [user, investmentAccountId, limitCount]);

  const loadMore = useCallback(() => setLimitCount((p) => p + PAGE_SIZE), []);

  return { transactions, loading, hasMore, loadMore };
}
