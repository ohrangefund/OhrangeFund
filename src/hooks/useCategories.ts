import { useEffect, useState, useMemo } from 'react';
import { subscribeToCategories } from '@/api/categories';
import { useAuth } from '@/context/AuthContext';
import type { Category } from '@/types/models';

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCategories(user.uid, (data) => {
      setCategories(data);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories],
  );

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories],
  );

  return { categories, incomeCategories, expenseCategories, loading };
}
