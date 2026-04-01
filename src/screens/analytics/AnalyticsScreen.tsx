import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, Layers } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { BalanceLineChart, type LineData } from '@/components/charts/BalanceLineChart';
import { IncomeExpenseBarChart, type MonthBarData } from '@/components/charts/IncomeExpenseBarChart';
import type { Account } from '@/types/models';

const LINE_CHART_HEIGHT = 220;
const BAR_CHART_HEIGHT = 200;
const TOTAL_COLOR = '#F97316';

type AnalyticsPeriod = '6m' | '1y';
const ANALYTICS_PERIODS: AnalyticsPeriod[] = ['6m', '1y'];

type MonthInfo = { year: number; month: number; label: string };

export function AnalyticsScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 32;

  const { accounts } = useAccounts();
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('6m');
  const [offset, setOffset] = useState(0);
  const [showBarPicker, setShowBarPicker] = useState(false);
  const [selectedBarAccountId, setSelectedBarAccountId] = useState<string | null>(null);

  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';

  function handlePeriodChange(p: AnalyticsPeriod) {
    setAnalyticsPeriod(p);
    setOffset(0);
  }

  // Months array: always fixed size, purely from period + offset
  const months = useMemo((): MonthInfo[] => {
    const now = new Date();
    const periodMonths = analyticsPeriod === '6m' ? 6 : 12;
    const result: MonthInfo[] = [];
    for (let i = periodMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset * periodMonths - i, 1);
      result.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: new Intl.DateTimeFormat(locale, { month: 'short' }).format(d),
      });
    }
    return result;
  }, [analyticsPeriod, offset, locale]);

  // since = start of first visible month (for data subscription)
  const since = useMemo(() => {
    const first = months[0];
    return new Date(first.year, first.month, 1, 0, 0, 0, 0);
  }, [months]);

  const { transactions, transfers, loading } = useAnalyticsData(since);

  // Navigation label: "Jan – Jun 2025" or "Nov 2024 – Abr 2025"
  const rangeLabel = useMemo(() => {
    if (months.length === 0) return '';
    const first = months[0];
    const last = months[months.length - 1];
    const fmtShort = new Intl.DateTimeFormat(locale, { month: 'short' });
    const fmtFull = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' });
    const firstDate = new Date(first.year, first.month, 1);
    const lastDate = new Date(last.year, last.month, 1);
    if (first.year === last.year) {
      return `${fmtShort.format(firstDate)} – ${fmtFull.format(lastDate)}`;
    }
    return `${fmtFull.format(firstDate)} – ${fmtFull.format(lastDate)}`;
  }, [months, locale]);

  // Month labels with decimation for 1y to avoid crowding
  const monthLabels = useMemo(
    () => months.map((m, i) => (analyticsPeriod === '6m' ? m.label : (i % 2 === 0 ? m.label : ''))),
    [months, analyticsPeriod],
  );

  // Balance line chart: reconstruct per-account balance history
  const lineChartLines = useMemo((): LineData[] => {
    if (accounts.length === 0) return [];

    const { year: lastYear, month: lastMonth } = months[months.length - 1];
    const windowEnd = new Date(lastYear, lastMonth + 1, 0, 23, 59, 59, 999);

    const accountLines: LineData[] = accounts.map((account) => {
      const accountTxns = transactions.filter((t) => t.account_id === account.id);
      const accountTransfers = transfers.filter(
        (tr) => tr.from_account_id === account.id || tr.to_account_id === account.id,
      );

      // Unwind transactions that happened after the visible window end
      const postTxnNet = accountTxns
        .filter((t) => t.date.toDate() > windowEnd)
        .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
      const postTransferNet = accountTransfers
        .filter((tr) => tr.date.toDate() > windowEnd)
        .reduce((s, tr) => (tr.from_account_id === account.id ? s - tr.amount : s + tr.amount), 0);

      let balance = account.balance - postTxnNet - postTransferNet;
      const values: number[] = new Array(months.length);

      for (let i = months.length - 1; i >= 0; i--) {
        values[i] = balance;
        if (i > 0) {
          const { year, month } = months[i];

          const txnNet = accountTxns
            .filter((t) => {
              const d = t.date.toDate();
              return d.getFullYear() === year && d.getMonth() === month;
            })
            .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);

          const transferNet = accountTransfers
            .filter((tr) => {
              const d = tr.date.toDate();
              return d.getFullYear() === year && d.getMonth() === month;
            })
            .reduce((s, tr) => (tr.from_account_id === account.id ? s - tr.amount : s + tr.amount), 0);

          balance = balance - txnNet - transferNet;
        }
      }

      return { color: account.color, label: account.name, values };
    });

    if (accounts.length === 1) return accountLines;

    const totalValues = months.map((_, i) =>
      accountLines.reduce((sum, line) => sum + line.values[i], 0),
    );
    return [{ color: TOTAL_COLOR, label: t('analytics.allAccounts'), values: totalValues }, ...accountLines];
  }, [accounts, transactions, transfers, months, t]);

  // Bar chart data
  const barChartData = useMemo((): MonthBarData[] => {
    const filtered = selectedBarAccountId
      ? transactions.filter((tx) => tx.account_id === selectedBarAccountId)
      : transactions;

    return months.map(({ year, month, label }) => {
      const monthTxns = filtered.filter((tx) => {
        const d = tx.date.toDate();
        return d.getFullYear() === year && d.getMonth() === month;
      });
      return {
        month: label,
        income: monthTxns.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0),
        expense: monthTxns.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0),
      };
    });
  }, [transactions, months, selectedBarAccountId]);

  const selectedBarAccount: Account | undefined = accounts.find((a) => a.id === selectedBarAccountId);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Period selector */}
      <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
        {ANALYTICS_PERIODS.map((p) => (
          <Pressable
            key={p}
            onPress={() => handlePeriodChange(p)}
            style={[styles.periodBtn, analyticsPeriod === p && { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.periodBtnText, { color: analyticsPeriod === p ? colors.primaryForeground : colors.textSecondary }]}>
              {t(`analytics.period${p.charAt(0).toUpperCase() + p.slice(1)}` as any)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Date navigation */}
      <View style={[styles.dateNavRow, { backgroundColor: colors.surface }]}>
        <Pressable onPress={() => setOffset((o) => o - 1)} style={styles.navBtn} hitSlop={8}>
          <ChevronLeft size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.dateLabel, { color: colors.text }]} numberOfLines={1}>{rangeLabel}</Text>
        <Pressable
          onPress={() => setOffset((o) => o + 1)}
          style={styles.navBtn}
          disabled={offset >= 0}
          hitSlop={8}
        >
          <ChevronRight size={18} color={offset >= 0 ? colors.textDisabled : colors.text} />
        </Pressable>
      </View>

      {/* ── Balance history ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('analytics.balanceHistory')}
      </Text>

      {loading ? (
        <View style={[styles.chartPlaceholder, { height: LINE_CHART_HEIGHT }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : accounts.length === 0 ? (
        <View style={[styles.chartPlaceholder, { height: LINE_CHART_HEIGHT, backgroundColor: colors.surface }]}>
          <Text style={[styles.noData, { color: colors.textSecondary }]}>{t('analytics.noData')}</Text>
        </View>
      ) : (
        <BalanceLineChart
          lines={lineChartLines}
          monthLabels={monthLabels}
          width={chartWidth}
          height={LINE_CHART_HEIGHT}
        />
      )}

      {/* Legend */}
      {!loading && accounts.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legend}>
          <View style={styles.legendRow}>
            {accounts.length > 1 && (
              <View style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: TOTAL_COLOR }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>
                  {t('analytics.allAccounts')}
                </Text>
              </View>
            )}
            {accounts.map((account) => (
              <View key={account.id} style={styles.legendItem}>
                <View style={[styles.legendLine, { backgroundColor: account.color }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{account.name}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ── Income vs Expense ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('analytics.incomeVsExpense')}
      </Text>

      {/* Account picker */}
      <Pressable
        onPress={() => setShowBarPicker(true)}
        style={({ pressed }) => [
          styles.accountSelector,
          { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        {selectedBarAccount ? (
          <View style={[styles.accountDot, { backgroundColor: selectedBarAccount.color }]} />
        ) : (
          <Layers size={16} color={colors.primary} />
        )}
        <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
          {selectedBarAccount ? selectedBarAccount.name : t('analytics.allAccounts')}
        </Text>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>

      {loading ? (
        <View style={[styles.chartPlaceholder, { height: BAR_CHART_HEIGHT }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <IncomeExpenseBarChart
          data={barChartData}
          width={chartWidth}
          height={BAR_CHART_HEIGHT}
        />
      )}

      {/* Bar chart legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{t('home.income')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{t('home.expenses')}</Text>
        </View>
      </View>

      <SelectAccountModal
        visible={showBarPicker}
        accounts={accounts}
        selectedId={selectedBarAccountId}
        onSelect={(account) => { setSelectedBarAccountId(account.id); setShowBarPicker(false); }}
        onSelectTotal={() => { setSelectedBarAccountId(null); setShowBarPicker(false); }}
        onClose={() => setShowBarPicker(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  periodRow: {
    flexDirection: 'row', borderRadius: 14,
    padding: 4, gap: 4, marginBottom: 8,
  },
  periodBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10,
  },
  periodBtnText: { fontSize: 13, fontWeight: '600' },
  dateNavRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, paddingHorizontal: 8, paddingVertical: 10, marginBottom: 16,
  },
  navBtn: { padding: 4 },
  dateLabel: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  chartPlaceholder: {
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  noData: { fontSize: 14 },
  legend: { marginTop: 10, marginBottom: 4 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10, marginBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 18, height: 3, borderRadius: 2 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: 12 },
  divider: { height: 1, marginVertical: 20 },
  accountSelector: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, gap: 10, marginBottom: 12,
  },
  accountDot: { width: 10, height: 10, borderRadius: 5 },
  accountName: { flex: 1, fontSize: 15, fontWeight: '600' },
});
