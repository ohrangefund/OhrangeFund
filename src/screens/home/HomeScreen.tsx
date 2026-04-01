import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, ChevronDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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

  const generalAccountIds = useMemo(
    () => new Set(accounts.filter((a) => a.show_in_general !== false).map((a) => a.id)),
    [accounts],
  );

  const filteredTransactions = useMemo(
    () => transactions.filter(
      (t) => t.type === activeTab && (isTotal ? generalAccountIds.has(t.account_id) : true),
    ),
    [transactions, activeTab, isTotal, generalAccountIds],
  );

  const displayAmount = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
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
          {t('home.noAccounts')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable
        onPress={() => setShowAccountPicker(true)}
        style={({ pressed }) => [styles.accountSelector, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
      >
        {isTotal
          ? <Layers size={16} color={colors.primary} />
          : <View style={[styles.accountDot, { backgroundColor: selectedAccount?.color ?? colors.primary }]} />
        }
        <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
          {isTotal ? t('home.general') : (selectedAccount?.name ?? '—')}
        </Text>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            {isTotal ? t('home.totalBalance') : t('home.currentBalance')}
          </Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>
            {formatCurrency(displayBalance)}
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            {activeTab === 'expense' ? t('home.totalExpenses') : t('home.totalIncome')}
          </Text>
          <Text style={[styles.cardValue, { color: activeTab === 'expense' ? colors.expense : colors.income }]}>
            {formatCurrency(displayAmount)}
          </Text>
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['expense', 'income'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.textSecondary }]}>
              {tab === 'expense' ? t('home.expenses') : t('home.income')}
            </Text>
          </Pressable>
        ))}
      </View>

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
              accountName={isTotal ? (accounts.find((a) => a.id === item.account_id)?.name) : undefined}
              onPress={() => setEditTransaction(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {activeTab === 'expense' ? t('home.noExpenses') : t('home.noIncome')}
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable onPress={loadMore} style={styles.loadMore}>
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>{t('home.loadMore')}</Text>
              </Pressable>
            ) : null
          }
        />
      )}

      <Pressable
        onPress={() => setShowAdd(true)}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
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
      <AddTransactionModal
        visible={showAdd}
        account={selectedAccount}
        accounts={accounts}
        onClose={() => setShowAdd(false)}
      />
      {editTransaction && (() => {
        const editAccount = accounts.find((a) => a.id === editTransaction.account_id) ?? null;
        return editAccount ? (
          <EditTransactionModal
            transaction={editTransaction}
            account={editAccount}
            accounts={accounts}
            onClose={() => setEditTransaction(null)}
          />
        ) : null;
      })()}
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
  cardsRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, gap: 10 },
  card: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  cardLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
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
