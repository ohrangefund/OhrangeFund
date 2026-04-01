import { useEffect, useState, useCallback } from 'react';
import { subscribeToTransactions } from '@/api/transactions';
import { useAuth } from '@/context/AuthContext';
import type { Transaction } from '@/types/models';

const PAGE_SIZE = 10;

export function useTransactions(
  accountId: string | null,
  startDate?: Date,
  endDate?: Date,
) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [limitCount, setLimitCount] = useState(PAGE_SIZE);

  const startTime = startDate?.getTime() ?? null;
  const endTime = endDate?.getTime() ?? null;

  // Reset pagination when date range or account changes
  useEffect(() => {
    setLimitCount(PAGE_SIZE);
  }, [startTime, endTime, accountId]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToTransactions(
      user.uid, accountId, limitCount,
      (data, more) => { setTransactions(data); setHasMore(more); setLoading(false); },
      startDate, endDate,
    );
    return unsub;
  }, [user, accountId, limitCount, startTime, endTime]);

  const loadMore = useCallback(() => {
    setLimitCount((prev) => prev + PAGE_SIZE);
  }, []);

  return { transactions, loading, hasMore, loadMore };
}
