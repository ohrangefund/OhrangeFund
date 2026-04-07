import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToPendingInvites } from '@/api/accountMembers';
import type { AccountMember } from '@/types/models';

export function usePendingInvites() {
  const { user } = useAuth();
  const [pendingInvites, setPendingInvites] = useState<AccountMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPendingInvites([]); setLoading(false); return; }
    setLoading(true);
    const unsubscribe = subscribeToPendingInvites(user.uid, (invites) => {
      setPendingInvites(invites);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return { pendingInvites, loading };
}
