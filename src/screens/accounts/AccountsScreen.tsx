import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, ArrowRightLeft, History } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountCard } from '@/components/shared/AccountCard';
import { AddAccountModal } from '@/modals/AddAccountModal';
import { EditAccountModal } from '@/modals/EditAccountModal';
import { AddTransferModal } from '@/modals/AddTransferModal';
import { formatCurrency } from '@/utils/currency';
import type { Account } from '@/types/models';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AccountsStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<AccountsStackParamList, 'AccountsMain'>;

export function AccountsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { accounts, archived, totalBalance, loading } = useAccounts();
  const [showAdd, setShowAdd] = useState(false);
  const [showAddTransfer, setShowAddTransfer] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.netWorth, { backgroundColor: colors.surface }]}>
        <Text style={[styles.netWorthLabel, { color: colors.textSecondary }]}>{t('accounts.totalBalance')}</Text>
        <Text style={[styles.netWorthAmount, { color: colors.text }]}>{formatCurrency(totalBalance)}</Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => setShowAddTransfer(true)}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
        >
          <ArrowRightLeft size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>{t('accounts.newTransfer')}</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('TransfersHistory')}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
        >
          <History size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.text }]}>{t('accounts.history')}</Text>
        </Pressable>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <AccountCard account={item} onPress={() => setEditAccount(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('accounts.noAccounts')}
            </Text>
          </View>
        }
        ListFooterComponent={
          archived.length > 0 ? (
            <View style={styles.archivedSection}>
              <View style={[styles.archivedDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.archivedHeader, { color: colors.textSecondary }]}>{t('accounts.archived')}</Text>
              {archived.map((item) => (
                <View key={item.id} style={styles.archivedCard}>
                  <AccountCard account={item} onPress={() => setEditAccount(item)} />
                </View>
              ))}
            </View>
          ) : null
        }
      />

      <Pressable
        onPress={() => setShowAdd(true)}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <AddAccountModal visible={showAdd} onClose={() => setShowAdd(false)} />
      <EditAccountModal account={editAccount} onClose={() => setEditAccount(null)} />
      <AddTransferModal visible={showAddTransfer} onClose={() => setShowAddTransfer(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  netWorth: { margin: 16, borderRadius: 16, padding: 20, alignItems: 'center' },
  netWorthLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  netWorthAmount: { fontSize: 32, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14,
  },
  actionText: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 0 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15 },
  archivedSection: { marginTop: 8, paddingBottom: 100 },
  archivedDivider: { height: 1, marginBottom: 20 },
  archivedHeader: { fontSize: 13, fontWeight: '600', marginBottom: 8, paddingHorizontal: 4 },
  archivedCard: { flex: 1, opacity: 0.4 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
});
