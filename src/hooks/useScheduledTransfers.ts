import { useEffect, useState } from 'react';
import { subscribeToScheduledTransfers } from '@/api/scheduledTransfers';
import { useAuth } from '@/context/AuthContext';
import type { ScheduledTransfer } from '@/types/models';

export function useScheduledTransfers() {
  const { user } = useAuth();
  const [scheduled, setScheduled] = useState<ScheduledTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToScheduledTransfers(user.uid, (data) => {
      setScheduled(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { scheduled, loading };
}
