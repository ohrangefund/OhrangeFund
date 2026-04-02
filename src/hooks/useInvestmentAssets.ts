import { useEffect, useState } from 'react';
import { subscribeToInvestmentAssets } from '@/api/investmentAssets';
import { useAuth } from '@/context/AuthContext';
import type { InvestmentAsset } from '@/types/models';

export function useInvestmentAssets(investmentAccountId: string | null) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !investmentAccountId) { setLoading(false); return; }
    setLoading(true);
    const unsub = subscribeToInvestmentAssets(
      user.uid,
      investmentAccountId,
      (data) => { setAssets(data); setLoading(false); },
    );
    return unsub;
  }, [user, investmentAccountId]);

  return { assets, loading };
}
