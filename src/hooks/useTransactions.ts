import { useEffect, useState, useCallback } from 'react';
import { subscribeToTransactions, subscribeToGeneralTransactions } from '@/api/transactions';
import { useAuth } from '@/context/AuthContext';
import type { Transaction } from '@/types/models';

const PAGE_SIZE = 10;

export function useTransactions(
  accountId: string | null,
  startDate?: Date,
  endDate?: Date,
  isSharedAccount?: boolean,
  /** IDs of shared accounts to include in the general view (accountId === null) */
  generalSharedAccountIds?: string[],
) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [limitCount, setLimitCount] = useState(PAGE_SIZE);

  const startTime = startDate?.getTime() ?? null;
  const endTime   = endDate?.getTime()   ?? null;
  // Stable string key so we can use it in the dependency array
  const sharedIdsKey = (generalSharedAccountIds ?? []).join(',');

  useEffect(() => {
    setLimitCount(PAGE_SIZE);
  }, [startTime, endTime, accountId, sharedIdsKey]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const isGeneralWithShared =
      accountId === null &&
      generalSharedAccountIds != null &&
      generalSharedAccountIds.length > 0;

    const unsub = isGeneralWithShared
      ? subscribeToGeneralTransactions(
          user.uid,
          generalSharedAccountIds!,
          limitCount,
          (data, more) => { setTransactions(data); setHasMore(more); setLoading(false); },
          startDate,
          endDate,
        )
      : subscribeToTransactions(
          user.uid, accountId, limitCount,
          (data, more) => { setTransactions(data); setHasMore(more); setLoading(false); },
          startDate, endDate, isSharedAccount,
        );

    return unsub;
  }, [user, accountId, limitCount, startTime, endTime, sharedIdsKey]);

  const loadMore = useCallback(() => {
    setLimitCount((prev) => prev + PAGE_SIZE);
  }, []);

  return { transactions, loading, hasMore, loadMore };
}
