import { useEffect, useState, useCallback } from 'react';
import { subscribeToTransactions } from '@/api/transactions';
import { useAuth } from '@/context/AuthContext';
import type { Transaction } from '@/types/models';

const PAGE_SIZE = 10;

export function useTransactions(accountId: string | null) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [limitCount, setLimitCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToTransactions(user.uid, accountId, limitCount, (data, more) => {
      setTransactions(data);
      setHasMore(more);
      setLoading(false);
    });
    return unsub;
  }, [user, accountId, limitCount]);

  const loadMore = useCallback(() => {
    setLimitCount((prev) => prev + PAGE_SIZE);
  }, []);

  return { transactions, loading, hasMore, loadMore };
}
