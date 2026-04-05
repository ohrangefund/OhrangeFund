import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToBudgets } from '@/api/budgets';
import type { Budget } from '@/types/models';

export function useBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToBudgets(user.uid, (data) => {
      setBudgets(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { budgets, loading };
}
