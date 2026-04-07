import { useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Plus, Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useSharedAccounts } from '@/hooks/useSharedAccounts';
import { usePendingInvites } from '@/hooks/usePendingInvites';
import { removeMember } from '@/api/accountMembers';
import { AccountCard } from '@/components/shared/AccountCard';
import { AddSharedAccountModal } from '@/modals/AddSharedAccountModal';
import { EditSharedAccountModal } from '@/modals/EditSharedAccountModal';
import { PendingInvitesModal } from '@/modals/PendingInvitesModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatCurrency } from '@/utils/currency';
import type { Account } from '@/types/models';
import type { SharedAccountEntry } from '@/api/accountMembers';

export function SharedAccountsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { ownedShared, memberEntries, memberAccounts, loading } = useSharedAccounts();
  const { pendingInvites } = usePendingInvites();

  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [leaveEntry, setLeaveEntry] = useState<SharedAccountEntry | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [showPending, setShowPending] = useState(false);

  async function handleLeave() {
    if (!leaveEntry) return;
    setLeaving(true);
    try {
      await removeMember(leaveEntry.memberId);
    } finally {
      setLeaving(false);
      setLeaveEntry(null);
    }
  }

  const totalBalance = [...ownedShared, ...memberAccounts]
    .reduce((sum, a) => sum + a.balance, 0);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const isEmpty = ownedShared.length === 0 && memberEntries.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.screenHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>{t('drawer.shared')}</Text>
        <Pressable
          onPress={() => setShowPending(true)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          hitSlop={8}
        >
          <View>
            <Bell size={22} color={colors.text} />
            {pendingInvites.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{pendingInvites.length}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      {/* Summary card */}
      {(ownedShared.length > 0 || memberAccounts.length > 0) && (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
            {t('sharing.sharedTotal')}
          </Text>
          <Text style={[styles.summaryAmount, { color: colors.text }]}>
            {formatCurrency(totalBalance)}
          </Text>
        </View>
      )}

      <FlatList
        data={[]}
        keyExtractor={() => ''}
        renderItem={null}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {/* Owned shared accounts */}
            {ownedShared.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {t('sharing.myShared')}
                </Text>
                {ownedShared.map((account) => (
                  <View key={account.id} style={styles.cardWrap}>
                    <AccountCard
                      account={account}
                      onPress={() => setEditAccount(account)}
                    />
                  </View>
                ))}
              </>
            )}

            {/* Member accounts */}
            {memberEntries.length > 0 && (
              <>
                <Text style={[
                  styles.sectionLabel,
                  { color: colors.textSecondary, marginTop: ownedShared.length > 0 ? 24 : 0 },
                ]}>
                  {t('sharing.sharedWithMe')}
                </Text>
                {memberEntries.map(({ account, memberId, ownerEmail }) => (
                  <View key={memberId} style={styles.cardWrap}>
                    <AccountCard
                      account={account}
                      onPress={() => setLeaveEntry({ account, memberId, ownerEmail })}
                    />
                  </View>
                ))}
              </>
            )}

            {isEmpty && (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t('sharing.noShared')}
                </Text>
              </View>
            )}
          </>
        }
      />

      <Pressable
        onPress={() => setShowAdd(true)}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <AddSharedAccountModal visible={showAdd} onClose={() => setShowAdd(false)} />
      <EditSharedAccountModal account={editAccount} onClose={() => setEditAccount(null)} />
      <PendingInvitesModal
        visible={showPending}
        invites={pendingInvites}
        onClose={() => setShowPending(false)}
      />

      <ConfirmModal
        visible={!!leaveEntry}
        title={t('sharing.leaveTitle')}
        message={t('sharing.leaveMsg')}
        confirmLabel={t('sharing.leaveBtn')}
        onConfirm={handleLeave}
        onCancel={() => setLeaveEntry(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  screenTitle: { fontSize: 24, fontWeight: '700' },
  badge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  summaryCard: {
    margin: 16, marginBottom: 0,
    borderRadius: 16, padding: 20, alignItems: 'center',
  },
  summaryLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  summaryAmount: { fontSize: 32, fontWeight: '700' },
  list: { padding: 16, paddingBottom: 100 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 },
  cardWrap: { marginBottom: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
});
