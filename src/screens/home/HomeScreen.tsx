import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, ChevronDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { Layers } from 'lucide-react-native';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { TransactionItem } from '@/components/shared/TransactionItem';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { AddTransactionModal } from '@/modals/AddTransactionModal';
import { EditTransactionModal } from '@/modals/EditTransactionModal';
import { formatCurrency } from '@/utils/currency';
import type { Account, Transaction } from '@/types/models';

const SELECTED_ACCOUNT_KEY = 'selectedAccountId';

export function HomeScreen() {
  const { colors } = useTheme();
  const { accounts, totalBalance, loading: accountsLoading } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const TOTAL_KEY = '__total__';

  useEffect(() => {
    AsyncStorage.getItem(SELECTED_ACCOUNT_KEY).then((id) => {
      if (id === TOTAL_KEY) {
        setSelectedAccountId(null);
      } else if (id) {
        setSelectedAccountId(id);
      }
    });
  }, []);

  // null = Geral (all accounts); string = specific account
  const isTotal = selectedAccountId === null;
  const selectedAccount: Account | null = isTotal
    ? null
    : accounts.find((a) => a.id === selectedAccountId) ?? null;
  const displayBalance = isTotal ? totalBalance : (selectedAccount?.balance ?? 0);

  function handleSelectAccount(account: Account) {
    setSelectedAccountId(account.id);
    AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, account.id);
    setShowAccountPicker(false);
  }

  function handleSelectTotal() {
    setSelectedAccountId(null);
    AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, TOTAL_KEY);
  }

  const { transactions, loading: txLoading, hasMore, loadMore } = useTransactions(selectedAccountId);
  const { categories } = useCategories();

  const filteredTransactions = useMemo(
    () => transactions.filter((t) => t.type === activeTab),
    [transactions, activeTab],
  );

  if (accountsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (accounts.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Sem contas. Cria uma na tab Contas!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Account selector */}
      <Pressable
        onPress={() => setShowAccountPicker(true)}
        style={({ pressed }) => [styles.accountSelector, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
      >
        {isTotal
          ? <Layers size={16} color={colors.primary} />
          : <View style={[styles.accountDot, { backgroundColor: selectedAccount?.color ?? colors.primary }]} />
        }
        <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
          {isTotal ? 'Geral' : (selectedAccount?.name ?? '—')}
        </Text>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>

      {/* Balance card */}
      <View style={[styles.balanceCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
          {isTotal ? 'Saldo total' : 'Saldo atual'}
        </Text>
        <Text style={[styles.balance, { color: colors.text }]}>
          {formatCurrency(displayBalance)}
        </Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['expense', 'income'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
              {tab === 'expense' ? 'Despesas' : 'Receitas'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Transaction list */}
      {txLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
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
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeTab === 'expense' ? 'Sem despesas.' : 'Sem receitas.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable onPress={loadMore} style={styles.loadMore}>
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>Carregar mais</Text>
              </Pressable>
            ) : null
          }
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => selectedAccount && setShowAdd(true)}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: isTotal ? 0.35 : pressed ? 0.85 : 1 }]}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <SelectAccountModal
        visible={showAccountPicker}
        accounts={accounts}
        selectedId={selectedAccountId}
        onSelect={handleSelectAccount}
        onSelectTotal={handleSelectTotal}
        onClose={() => setShowAccountPicker(false)}
      />
      {selectedAccount && (
        <>
          <AddTransactionModal
            visible={showAdd}
            account={selectedAccount}
            onClose={() => setShowAdd(false)}
          />
          <EditTransactionModal
            transaction={editTransaction}
            account={selectedAccount}
            onClose={() => setEditTransaction(null)}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  accountSelector: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, borderRadius: 14, padding: 14, gap: 10,
  },
  accountDot: { width: 10, height: 10, borderRadius: 5 },
  accountName: { flex: 1, fontSize: 16, fontWeight: '600' },
  balanceCard: {
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 16, padding: 20, alignItems: 'center',
  },
  balanceLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  balance: { fontSize: 36, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 4 },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: { fontSize: 15, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
});
