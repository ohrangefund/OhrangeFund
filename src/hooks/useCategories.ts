import { useEffect, useState, useMemo, useRef } from 'react';
import { subscribeToCategories, createDefaultCategories, seedCategoryTemplates } from '@/api/categories';
import { useAuth } from '@/context/AuthContext';
import type { Category } from '@/types/models';

export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCategories(user.uid, (data) => {
      if (!initialized.current) {
        initialized.current = true;
        if (!data.some((c) => c.is_default)) {
          createDefaultCategories(user.uid);
        } else if (!data.some((c) => !c.is_default)) {
          seedCategoryTemplates(user.uid);
        }
      }
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
