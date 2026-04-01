import { useEffect, useState } from 'react';
import { subscribeToTransactionsForAnalytics } from '@/api/transactions';
import { subscribeToTransfersForAnalytics } from '@/api/transfers';
import { useAuth } from '@/context/AuthContext';
import type { Transaction, Transfer } from '@/types/models';

export function useAnalyticsData(since?: Date) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [txnLoading, setTxnLoading] = useState(true);
  const [trfLoading, setTrfLoading] = useState(true);

  const sinceTime = since?.getTime() ?? null;

  useEffect(() => {
    if (!user) return;
    setTxnLoading(true);
    setTrfLoading(true);
    const sinceDate = sinceTime !== null ? new Date(sinceTime) : new Date(2000, 0, 1);

    const unsubTxn = subscribeToTransactionsForAnalytics(user.uid, sinceDate, (data) => {
      setTransactions(data);
      setTxnLoading(false);
    });
    const unsubTrf = subscribeToTransfersForAnalytics(user.uid, sinceDate, (data) => {
      setTransfers(data);
      setTrfLoading(false);
    });

    return () => { unsubTxn(); unsubTrf(); };
  }, [user, sinceTime]);

  return { transactions, transfers, loading: txnLoading || trfLoading };
}
