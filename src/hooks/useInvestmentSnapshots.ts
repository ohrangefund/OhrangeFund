import { useEffect, useState } from 'react';
import { subscribeToInvestmentSnapshots } from '@/api/investmentSnapshots';
import { useAuth } from '@/context/AuthContext';
import type { InvestmentSnapshot } from '@/types/models';

export function useInvestmentSnapshots(investmentAccountId: string | null) {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<InvestmentSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !investmentAccountId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToInvestmentSnapshots(
      user.uid,
      investmentAccountId,
      (data) => { setSnapshots(data); setLoading(false); },
    );
    return unsub;
  }, [user, investmentAccountId]);

  return { snapshots, loading };
}
