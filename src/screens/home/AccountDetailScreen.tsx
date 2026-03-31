import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, X, ArrowDownLeft, ArrowRightLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useTransfers } from '@/hooks/useTransfers';
import { useCategories } from '@/hooks/useCategories';
import { TransactionItem } from '@/components/shared/TransactionItem';
import { TransferItem } from '@/components/shared/TransferItem';
import { AddTransactionModal } from '@/modals/AddTransactionModal';
import { EditTransactionModal } from '@/modals/EditTransactionModal';
import { AddTransferModal } from '@/modals/AddTransferModal';
import { EditTransferModal } from '@/modals/EditTransferModal';
import { formatCurrency } from '@/utils/currency';
import type { Transaction, Transfer } from '@/types/models';
import type { AccountsStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<AccountsStackParamList, 'AccountDetail'>;

export function AccountDetailScreen({ route }: Props) {
  const { colors } = useTheme();
  const { accounts } = useAccounts();
  const account = accounts.find((a) => a.id === route.params.accountId);
  const { transactions, loading: txLoading, hasMore: txHasMore, loadMore: loadMoreTx } = useTransactions(route.params.accountId);
  const { transfers, loading: trLoading, hasMore: trHasMore, loadMore: loadMoreTr } = useTransfers(route.params.accountId);
  const { categories } = useCategories();

  const [activeTab, setActiveTab] = useState<'transactions' | 'transfers'>('transactions');
  const [fabOpen, setFabOpen] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddTransfer, setShowAddTransfer] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [editTransfer, setEditTransfer] = useState<Transfer | null>(null);

  if (!account) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Conta não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.balance, { color: colors.text }]}>{formatCurrency(account.balance)}</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Saldo atual</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['transactions', 'transfers'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
              {tab === 'transactions' ? 'Transações' : 'Transferências'}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'transactions' ? (
        txLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TransactionItem
                transaction={item}
                category={categories.find((c) => c.id === item.category_id)}
                onPress={() => setEditTransaction(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sem transações.</Text>
              </View>
            }
            ListFooterComponent={
              txHasMore ? (
                <Pressable onPress={loadMoreTx} style={styles.loadMore}>
                  <Text style={[styles.loadMoreText, { color: colors.primary }]}>Carregar mais</Text>
                </Pressable>
              ) : null
            }
          />
        )
      ) : (
        trLoading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            data={transfers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TransferItem
                transfer={item}
                currentAccountId={account.id}
                accounts={accounts}
                onPress={() => setEditTransfer(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sem transferências.</Text>
              </View>
            }
            ListFooterComponent={
              trHasMore ? (
                <Pressable onPress={loadMoreTr} style={styles.loadMore}>
                  <Text style={[styles.loadMoreText, { color: colors.primary }]}>Carregar mais</Text>
                </Pressable>
              ) : null
            }
          />
        )
      )}

      {/* FAB expandable */}
      {fabOpen && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setFabOpen(false)} />

          <Pressable
            onPress={() => { setFabOpen(false); setShowAddTransfer(true); }}
            style={({ pressed }) => [styles.subFab, styles.subFab2, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
          >
            <ArrowRightLeft size={20} color={colors.primary} />
            <Text style={[styles.subFabLabel, { color: colors.text }]}>Transferência</Text>
          </Pressable>

          <Pressable
            onPress={() => { setFabOpen(false); setShowAddTransaction(true); }}
            style={({ pressed }) => [styles.subFab, styles.subFab1, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
          >
            <ArrowDownLeft size={20} color={colors.primary} />
            <Text style={[styles.subFabLabel, { color: colors.text }]}>Transação</Text>
          </Pressable>
        </>
      )}

      <Pressable
        onPress={() => setFabOpen((o) => !o)}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        {fabOpen ? <X size={26} color="#fff" /> : <Plus size={26} color="#fff" />}
      </Pressable>

      <AddTransactionModal
        visible={showAddTransaction}
        account={account}
        accounts={accounts}
        onClose={() => setShowAddTransaction(false)}
      />
      <EditTransactionModal
        transaction={editTransaction}
        account={account}
        accounts={accounts}
        onClose={() => setEditTransaction(null)}
      />
      <AddTransferModal
        visible={showAddTransfer}
        fromAccount={account}
        onClose={() => setShowAddTransfer(false)}
      />
      <EditTransferModal
        transfer={editTransfer}
        onClose={() => setEditTransfer(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { margin: 16, borderRadius: 16, padding: 20, alignItems: 'center' },
  balance: { fontSize: 32, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 4 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 4 },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: { fontSize: 15, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15 },
  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontWeight: '600' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  subFab: {
    position: 'absolute', right: 16,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 28, paddingVertical: 12, paddingHorizontal: 18, gap: 10,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  subFab1: { bottom: 100 },
  subFab2: { bottom: 160 },
  subFabLabel: { fontSize: 15, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
});
