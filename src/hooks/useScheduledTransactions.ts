import { useEffect, useState } from 'react';
import { subscribeToScheduledTransactions } from '@/api/scheduledTransactions';
import { useAuth } from '@/context/AuthContext';
import type { ScheduledTransaction } from '@/types/models';

export function useScheduledTransactions() {
  const { user } = useAuth();
  const [scheduled, setScheduled] = useState<ScheduledTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToScheduledTransactions(user.uid, (data) => {
      setScheduled(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { scheduled, loading };
}
