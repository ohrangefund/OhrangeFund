import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useCategories } from '@/hooks/useCategories';
import { useScheduledTransactions } from '@/hooks/useScheduledTransactions';
import { useScheduledTransfers } from '@/hooks/useScheduledTransfers';
import { ScheduledTransactionItem } from '@/components/shared/ScheduledTransactionItem';
import { ScheduledTransferItem } from '@/components/shared/ScheduledTransferItem';
import { AddScheduledTransactionModal } from '@/modals/AddScheduledTransactionModal';
import { EditScheduledTransactionModal } from '@/modals/EditScheduledTransactionModal';
import { AddScheduledTransferModal } from '@/modals/AddScheduledTransferModal';
import { EditScheduledTransferModal } from '@/modals/EditScheduledTransferModal';
import type { ScheduledTransaction, ScheduledTransfer } from '@/types/models';

export function ScheduledScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { accounts } = useAccounts();
  const { incomeCategories, expenseCategories } = useCategories();
  const { scheduled: scheduledTxns, loading: loadingTxns } = useScheduledTransactions();
  const { scheduled: scheduledTransfers, loading: loadingTransfers } = useScheduledTransfers();

  const [activeTab, setActiveTab] = useState<'transactions' | 'transfers'>('transactions');
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [showAddTransfer, setShowAddTransfer] = useState(false);
  const [editTxn, setEditTxn] = useState<ScheduledTransaction | null>(null);
  const [editTransfer, setEditTransfer] = useState<ScheduledTransfer | null>(null);

  const allCategories = [...incomeCategories, ...expenseCategories];
  const loading = activeTab === 'transactions' ? loadingTxns : loadingTransfers;

  function handleFAB() {
    if (activeTab === 'transactions') {
      setShowAddTxn(true);
    } else {
      setShowAddTransfer(true);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['transactions', 'transfers'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
              {tab === 'transactions' ? t('scheduled.transactions') : t('scheduled.transfers')}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'transactions' ? (
        <FlatList
          data={scheduledTxns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ScheduledTransactionItem
              item={item}
              accounts={accounts}
              categories={allCategories}
              onPress={() => setEditTxn(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('scheduled.noTransactions')}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={scheduledTransfers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ScheduledTransferItem
              item={item}
              accounts={accounts}
              onPress={() => setEditTransfer(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('scheduled.noTransfers')}</Text>
            </View>
          }
        />
      )}

      <Pressable
        onPress={handleFAB}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <AddScheduledTransactionModal
        visible={showAddTxn}
        accounts={accounts}
        onClose={() => setShowAddTxn(false)}
      />
      <EditScheduledTransactionModal
        item={editTxn}
        accounts={accounts}
        onClose={() => setEditTxn(null)}
      />
      <AddScheduledTransferModal
        visible={showAddTransfer}
        accounts={accounts}
        onClose={() => setShowAddTransfer(false)}
      />
      <EditScheduledTransferModal
        item={editTransfer}
        accounts={accounts}
        onClose={() => setEditTransfer(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: { fontSize: 15, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
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
