import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { ALL_ICONS_MAP } from '@/components/ui/IconPickerModal';
import { AddBudgetModal } from '@/modals/AddBudgetModal';
import { EditBudgetModal } from '@/modals/EditBudgetModal';
import { formatCurrency } from '@/utils/currency';
import type { Budget, Category } from '@/types/models';

const WARNING_THRESHOLD = 0.8;

function progressColor(pct: number, colors: ReturnType<typeof useTheme>['colors']): string {
  if (pct >= 1) return colors.error;
  if (pct >= WARNING_THRESHOLD) return '#F59E0B';
  return colors.primary;
}

interface BudgetItemProps {
  budget: Budget;
  category: Category;
  spent: number;
  onPress: () => void;
}

function BudgetItem({ budget, category, spent, onPress }: BudgetItemProps) {
  const { colors } = useTheme();
  const pct = budget.amount_limit > 0 ? spent / budget.amount_limit : 0;
  const barColor = progressColor(pct, colors);
  const IconComponent = ALL_ICONS_MAP[category.icon as keyof typeof ALL_ICONS_MAP];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: category.color + '22' }]}>
        {IconComponent
          ? <IconComponent size={20} color={category.color} />
          : <View style={[styles.iconFallback, { backgroundColor: category.color }]} />
        }
      </View>

      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={[styles.amounts, { color: pct >= 1 ? colors.error : colors.textSecondary }]}>
            {formatCurrency(spent)} / {formatCurrency(budget.amount_limit)}
          </Text>
        </View>

        <View style={[styles.barBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: barColor },
            ]}
          />
        </View>

        <Text style={[styles.pctLabel, { color: barColor }]}>
          {Math.round(pct * 100)}%
        </Text>
      </View>
    </Pressable>
  );
}

export function BudgetsScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();

  const { budgets, loading: budgetsLoading } = useBudgets();
  const { expenseCategories, loading: catsLoading } = useCategories();

  const [offset, setOffset] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);

  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';

  const displayedMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  }, [offset]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(displayedMonth);

  const { transactions, loading: txLoading } = useAnalyticsData(displayedMonth);

  const spentByCategory = useMemo(() => {
    const y = displayedMonth.getFullYear();
    const m = displayedMonth.getMonth();
    return transactions
      .filter((tx) => {
        if (tx.type !== 'expense') return false;
        const d = tx.date.toDate();
        return d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((acc, tx) => {
        acc[tx.category_id] = (acc[tx.category_id] ?? 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions, displayedMonth]);

  const categoryMap = useMemo(
    () => Object.fromEntries(expenseCategories.map((c) => [c.id, c])),
    [expenseCategories],
  );

  const budgetedCategoryIds = useMemo(
    () => new Set(budgets.map((b) => b.category_id)),
    [budgets],
  );

  const totals = useMemo(() => {
    const totalLimit = budgets.reduce((s, b) => s + b.amount_limit, 0);
    const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.category_id] ?? 0), 0);
    return { totalLimit, totalSpent };
  }, [budgets, spentByCategory]);

  const loading = budgetsLoading || catsLoading || txLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navRow, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => setOffset((o) => o - 1)} hitSlop={8} style={styles.navBtn}>
          <ChevronLeft size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{monthLabel}</Text>
        <Pressable
          onPress={() => setOffset((o) => o + 1)}
          hitSlop={8}
          style={styles.navBtn}
          disabled={offset >= 0}
        >
          <ChevronRight size={18} color={offset >= 0 ? colors.textDisabled : colors.text} />
        </Pressable>
      </View>

      {!loading && budgets.length > 0 && (() => {
        const pct = totals.totalLimit > 0 ? totals.totalSpent / totals.totalLimit : 0;
        const barColor = progressColor(pct, colors);
        return (
          <View style={[styles.summary, { backgroundColor: colors.surface }]}>
            <View style={styles.summaryTop}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('budgets.totalSpent')}
              </Text>
              <Text style={[styles.summaryAmounts, { color: pct >= 1 ? colors.error : colors.text }]}>
                {formatCurrency(totals.totalSpent)}
                <Text style={[styles.summaryLimit, { color: colors.textSecondary }]}>
                  {' / '}{formatCurrency(totals.totalLimit)}
                </Text>
              </Text>
            </View>
            <View style={[styles.barBg, { backgroundColor: colors.border }]}>
              <View style={[styles.barFill, { width: `${Math.min(pct * 100, 100)}%`, backgroundColor: barColor }]} />
            </View>
          </View>
        );
      })()}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : budgets.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {t('budgets.noBudgets')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {budgets.map((budget) => {
            const category = categoryMap[budget.category_id];
            if (!category) return null;
            return (
              <BudgetItem
                key={budget.id}
                budget={budget}
                category={category}
                spent={spentByCategory[budget.category_id] ?? 0}
                onPress={() => setEditBudget(budget)}
              />
            );
          })}
        </ScrollView>
      )}

      <Pressable
        onPress={() => setShowAdd(true)}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <AddBudgetModal
        visible={showAdd}
        expenseCategories={expenseCategories}
        budgetedCategoryIds={budgetedCategoryIds}
        onClose={() => setShowAdd(false)}
      />
      <EditBudgetModal
        budget={editBudget}
        category={editBudget ? categoryMap[editBudget.category_id] : undefined}
        onClose={() => setEditBudget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    paddingHorizontal: 8, paddingVertical: 10,
  },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 14, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 15 },
  list: { padding: 16, paddingBottom: 100 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 16, marginBottom: 10, gap: 14,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  iconFallback: { width: 20, height: 20, borderRadius: 4 },
  itemBody: { flex: 1 },
  itemTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 8,
  },
  catName: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  amounts: { fontSize: 13, fontWeight: '500' },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 3 },
  pctLabel: { fontSize: 11, fontWeight: '600' },
  summary: {
    borderRadius: 16, marginHorizontal: 16, marginBottom: 8, padding: 16,
  },
  summaryTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', marginBottom: 10,
  },
  summaryLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  summaryAmounts: { fontSize: 18, fontWeight: '800' },
  summaryLimit: { fontSize: 13, fontWeight: '500' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
});
