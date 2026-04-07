import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, ChevronDown, ChevronLeft, ChevronRight, Layers } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useSharedAccounts } from '@/hooks/useSharedAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { TransactionItem } from '@/components/shared/TransactionItem';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { AddTransactionModal } from '@/modals/AddTransactionModal';
import { EditTransactionModal } from '@/modals/EditTransactionModal';
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart';
import { formatCurrency } from '@/utils/currency';
import type { Account, Transaction } from '@/types/models';

const SELECTED_ACCOUNT_KEY = 'selectedAccountId';

type Period = 'day' | 'week' | 'month' | 'year';
const PERIODS: Period[] = ['day', 'week', 'month', 'year'];

interface DateRange { start: Date; end: Date; label: string }

function getDateRange(period: Period, offset: number, locale: string): DateRange {
  const now = new Date();

  if (period === 'day') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return {
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
      label: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d),
    };
  }

  if (period === 'week') {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dow = (base.getDay() + 6) % 7; // Monday = 0
    const mon = new Date(base); mon.setDate(base.getDate() - dow + offset * 7);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const fmtShort = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    const fmtFull = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    const label = mon.getMonth() === sun.getMonth()
      ? `${mon.getDate()} – ${fmtFull.format(sun)}`
      : `${fmtShort.format(mon)} – ${fmtFull.format(sun)}`;
    return {
      start: new Date(mon.getFullYear(), mon.getMonth(), mon.getDate(), 0, 0, 0, 0),
      end: new Date(sun.getFullYear(), sun.getMonth(), sun.getDate(), 23, 59, 59, 999),
      label,
    };
  }

  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const raw = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d);
    return {
      start: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
      label: raw.charAt(0).toUpperCase() + raw.slice(1),
    };
  }

  // year
  const year = now.getFullYear() + offset;
  return {
    start: new Date(year, 0, 1, 0, 0, 0, 0),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
    label: String(year),
  };
}

export function HomeScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { ownedShared, memberAccounts } = useSharedAccounts();
  const allWritableAccounts = useMemo(
    () => [...accounts, ...ownedShared, ...memberAccounts],
    [accounts, ownedShared, memberAccounts],
  );
  const totalBalance = useMemo(
    () => allWritableAccounts
      .filter((a) => a.show_in_general !== false)
      .reduce((sum, a) => sum + a.balance, 0),
    [allWritableAccounts],
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [offset, setOffset] = useState(0);

  const TOTAL_KEY = '__total__';
  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';

  useEffect(() => {
    AsyncStorage.getItem(SELECTED_ACCOUNT_KEY).then((id) => {
      if (id === TOTAL_KEY) setSelectedAccountId(null);
      else if (id) setSelectedAccountId(id);
    });
  }, []);

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    setOffset(0);
  }

  const dateRange = useMemo(() => getDateRange(period, offset, locale), [period, offset, locale]);

  const isTotal = selectedAccountId === null;
  const selectedAccount: Account | null = isTotal
    ? null
    : allWritableAccounts.find((a) => a.id === selectedAccountId) ?? null;
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

  const isSharedAccount = selectedAccountId !== null && (
    ownedShared.some((a) => a.id === selectedAccountId) ||
    memberAccounts.some((a) => a.id === selectedAccountId)
  );
  const { transactions, loading: txLoading, hasMore, loadMore } = useTransactions(
    selectedAccountId, dateRange.start, dateRange.end, isSharedAccount,
  );
  const { categories } = useCategories();

  const generalAccountIds = useMemo(
    () => new Set([
      ...accounts.filter((a) => a.show_in_general !== false).map((a) => a.id),
      ...ownedShared.filter((a) => a.show_in_general !== false).map((a) => a.id),
      ...memberAccounts.filter((a) => a.show_in_general !== false).map((a) => a.id),
    ]),
    [accounts, ownedShared, memberAccounts],
  );

  const filteredTransactions = useMemo(
    () => transactions.filter(
      (tx) => tx.type === activeTab && (isTotal ? generalAccountIds.has(tx.account_id) : true),
    ),
    [transactions, activeTab, isTotal, generalAccountIds],
  );

  const displayAmount = useMemo(
    () => filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [filteredTransactions],
  );

  const donutSlices = useMemo((): DonutSlice[] => {
    const map = new Map<string, DonutSlice>();
    filteredTransactions.forEach((txn) => {
      const cat = categories.find((c) => c.id === txn.category_id);
      if (!cat) return;
      const existing = map.get(cat.id);
      if (existing) existing.value += txn.amount;
      else map.set(cat.id, { color: cat.color, value: txn.amount });
    });
    return Array.from(map.values());
  }, [filteredTransactions, categories]);

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
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('home.noAccounts')}</Text>
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
          {isTotal ? t('home.general') : (selectedAccount?.name ?? '—')}
        </Text>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>

      {/* Balance + donut cards */}
      <View style={styles.cardsRow}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            {isTotal ? t('home.totalBalance') : t('home.currentBalance')}
          </Text>
          <Text style={[styles.cardValue, { color: colors.text }]}>{formatCurrency(displayBalance)}</Text>
        </View>
        <View style={[styles.donutCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
            {activeTab === 'expense' ? t('home.totalExpenses') : t('home.totalIncome')}
          </Text>
          <DonutChart slices={donutSlices} centerLabel={formatCurrency(displayAmount)} size={110} ringWidth={20} />
        </View>
      </View>

      {/* Period type selector */}
      <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
        {PERIODS.map((p) => (
          <Pressable
            key={p}
            onPress={() => handlePeriodChange(p)}
            style={[styles.periodBtn, period === p && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.periodBtnText, { color: period === p ? colors.primaryForeground : colors.textSecondary }]}>
              {t(`home.period${p.charAt(0).toUpperCase() + p.slice(1)}` as any)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date navigation */}
      <View style={[styles.dateNavRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => setOffset((o) => o - 1)} style={styles.navBtn} hitSlop={8}>
          <ChevronLeft size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.dateLabel, { color: colors.text }]} numberOfLines={1}>{dateRange.label}</Text>
        <Pressable
          onPress={() => setOffset((o) => o + 1)}
          style={styles.navBtn}
          disabled={offset >= 0}
          hitSlop={8}
        >
          <ChevronRight size={18} color={offset >= 0 ? colors.textDisabled : colors.text} />
        </Pressable>
      </View>

      {/* Expense / Income tabs */}
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
              accountName={isTotal ? (allWritableAccounts.find((a) => a.id === item.account_id)?.name) : undefined}
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
        sharedAccounts={[...ownedShared, ...memberAccounts]}
        selectedId={selectedAccountId}
        onSelect={handleSelectAccount}
        onSelectTotal={handleSelectTotal}
        onClose={() => setShowAccountPicker(false)}
      />
      <AddTransactionModal
        visible={showAdd}
        account={selectedAccount}
        accounts={accounts}
        sharedAccounts={[...ownedShared, ...memberAccounts]}
        onClose={() => setShowAdd(false)}
      />
      {editTransaction && (() => {
        const editAccount = allWritableAccounts.find((a) => a.id === editTransaction.account_id) ?? null;
        return editAccount ? (
          <EditTransactionModal
            transaction={editTransaction}
            account={editAccount}
            accounts={accounts}
            sharedAccounts={[...ownedShared, ...memberAccounts]}
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
  cardsRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 10 },
  card: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center' },
  donutCard: { flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center', gap: 6 },
  cardLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: '700' },
  periodRow: {
    flexDirection: 'row', marginHorizontal: 16, borderRadius: 14,
    padding: 4, gap: 4, marginBottom: 6,
  },
  periodBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10,
  },
  periodBtnText: { fontSize: 13, fontWeight: '600' },
  dateNavRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 10,
    marginBottom: 6, borderBottomWidth: 0,
  },
  navBtn: { padding: 4 },
  dateLabel: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600' },
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
