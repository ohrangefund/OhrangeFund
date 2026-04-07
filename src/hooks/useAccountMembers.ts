import { useEffect, useState } from 'react';
import { subscribeToAccountMembers } from '@/api/accountMembers';
import type { AccountMember } from '@/types/models';

export function useAccountMembers(accountId: string | null) {
  const [members, setMembers] = useState<AccountMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accountId) { setMembers([]); setLoading(false); return; }
    setLoading(true);
    const unsubscribe = subscribeToAccountMembers(accountId, (data) => {
      setMembers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [accountId]);

  return { members, loading };
}
