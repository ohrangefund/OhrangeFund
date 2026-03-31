import { useEffect, useState, useCallback } from 'react';
import { subscribeToTransfers } from '@/api/transfers';
import { useAuth } from '@/context/AuthContext';
import type { Transfer } from '@/types/models';

const PAGE_SIZE = 10;

export function useTransfers(accountId: string) {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [limitCount, setLimitCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToTransfers(user.uid, accountId, limitCount, (data, more) => {
      setTransfers(data);
      setHasMore(more);
      setLoading(false);
    });
    return unsub;
  }, [user, accountId, limitCount]);

  const loadMore = useCallback(() => {
    setLimitCount((prev) => prev + PAGE_SIZE);
  }, []);

  return { transfers, loading, hasMore, loadMore };
}
