import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, useWindowDimensions, ScrollView,
} from 'react-native';
import { Plus, TrendingUp, TrendingDown, CalendarClock, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useInvestmentAccount } from '@/hooks/useInvestmentAccount';
import { useInvestmentAssets } from '@/hooks/useInvestmentAssets';
import { useInvestmentTransactions } from '@/hooks/useInvestmentTransactions';
import { useInvestmentSnapshots } from '@/hooks/useInvestmentSnapshots';
import { useScheduledInvestmentTransactions } from '@/hooks/useScheduledInvestmentTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { InvestmentAssetItem } from '@/components/shared/InvestmentAssetItem';
import { InvestmentLineChart, type SnapshotPoint } from '@/components/charts/InvestmentLineChart';
import { AddInvestmentAssetModal } from '@/modals/AddInvestmentAssetModal';
import { BuyAssetModal } from '@/modals/BuyAssetModal';
import { SellAssetModal } from '@/modals/SellAssetModal';
import { AddScheduledInvestmentModal } from '@/modals/AddScheduledInvestmentModal';
import { EditScheduledInvestmentModal } from '@/modals/EditScheduledInvestmentModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getAssetPrices } from '@/api/investmentPrices';
import { deleteInvestmentAsset } from '@/api/investmentAssets';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { InvestmentAsset, InvestmentTransaction, ScheduledInvestmentTransaction } from '@/types/models';

type Tab = 'portfolio' | 'history' | 'scheduled';
type ChartPeriod = '1w' | '1m' | '1y' | 'all';
const CHART_PERIODS: ChartPeriod[] = ['1w', '1m', '1y', 'all'];
const PERIOD_DAYS: Record<Exclude<ChartPeriod, 'all'>, number> = { '1w': 7, '1m': 30, '1y': 365 };

export function InvestmentScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const { account, loading: accLoading } = useInvestmentAccount();
  const { assets, loading: assetsLoading } = useInvestmentAssets(account?.id ?? null);
  const { transactions, loading: txLoading, hasMore, loadMore } = useInvestmentTransactions(account?.id ?? null);
  const { snapshots } = useInvestmentSnapshots(account?.id ?? null);
  const { items: scheduled } = useScheduledInvestmentTransactions(account?.id ?? null);
  const { accounts } = useAccounts();

  const [tab, setTab] = useState<Tab>('portfolio');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(false);

  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1m');
  const [chartOffset, setChartOffset] = useState(0);

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showAddScheduled, setShowAddScheduled] = useState(false);
  const [editScheduled, setEditScheduled] = useState<ScheduledInvestmentTransaction | null>(null);
  const [removeAsset, setRemoveAsset] = useState<InvestmentAsset | null>(null);
  const [removeError, setRemoveError] = useState('');

  const fetchPrices = useCallback(async () => {
    if (assets.length === 0) return;
    setPricesLoading(true);
    try {
      const tickers = assets.map((a) => a.ticker);
      const result = await getAssetPrices(tickers);
      setPrices(result);
    } finally {
      setPricesLoading(false);
    }
  }, [assets]);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  function handleRemovePress(asset: InvestmentAsset) {
    setRemoveError('');
    if (asset.quantity > 0) {
      setRemoveError(t('investments.removeErrorHasValue'));
      return;
    }
    const hasScheduled = scheduled.some((s) => s.asset_id === asset.id);
    if (hasScheduled) {
      setRemoveError(t('investments.removeErrorHasScheduled'));
      return;
    }
    setRemoveAsset(asset);
  }

  async function handleConfirmRemove() {
    if (!removeAsset) return;
    try {
      await deleteInvestmentAsset(removeAsset.id);
    } catch {
      setRemoveError(t('common.errorDelete'));
    } finally {
      setRemoveAsset(null);
    }
  }

  const portfolioValue = useMemo(
    () => assets.reduce((sum, a) => sum + Math.round(a.quantity * (prices[a.ticker] ?? 0)), 0),
    [assets, prices],
  );

  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';

  const { windowStart, windowEnd, rangeLabel } = useMemo(() => {
    if (chartPeriod === 'all') return { windowStart: null, windowEnd: null, rangeLabel: '' };
    const days = PERIOD_DAYS[chartPeriod];
    const now = new Date();
    const end = new Date(now.getTime() + chartOffset * days * 86400000);
    const start = new Date(end.getTime() - days * 86400000);
    const fmtShort = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    const fmtFull = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    const label = start.getFullYear() === end.getFullYear()
      ? `${fmtShort(start)} – ${fmtShort(end)} ${start.getFullYear()}`
      : `${fmtFull(start)} – ${fmtFull(end)}`;
    return { windowStart: start, windowEnd: end, rangeLabel: label };
  }, [chartPeriod, chartOffset, locale]);

  const chartPoints = useMemo((): SnapshotPoint[] => {
    const filtered = chartPeriod === 'all'
      ? snapshots
      : snapshots.filter((s) => {
          const d = new Date(s.captured_at.seconds * 1000);
          return d >= windowStart! && d <= windowEnd!;
        });
    return filtered.map((s) => ({
      value: s.total_value,
      label: new Date(s.captured_at.seconds * 1000).toLocaleDateString(locale, {
        day: '2-digit', month: 'short',
      }),
    }));
  }, [snapshots, chartPeriod, windowStart, windowEnd, locale]);

  const chartWidth = width - 32;

  if (accLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  function renderAssets() {
    if (assetsLoading) return <ActivityIndicator color={colors.primary} style={styles.loader} />;
    if (assets.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('investments.noAssets')}
          </Text>
        </View>
      );
    }
    return (
      <>
        {removeError ? (
          <Text style={[styles.removeError, { color: colors.error }]}>{removeError}</Text>
        ) : null}
        {assets.map((asset) => (
          <InvestmentAssetItem
            key={asset.id}
            asset={asset}
            currentPrice={prices[asset.ticker] ?? 0}
            onRemove={() => handleRemovePress(asset)}
          />
        ))}
      </>
    );
  }

  function renderHistory() {
    if (txLoading) return <ActivityIndicator color={colors.primary} style={styles.loader} />;
    if (transactions.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('investments.noHistory')}
          </Text>
        </View>
      );
    }
    return (
      <>
        {transactions.map((tx) => {
          const asset = assets.find((a) => a.id === tx.asset_id);
          const account = accounts.find((a) => a.id === tx.account_id);
          return (
            <View key={tx.id} style={[styles.txRow, { backgroundColor: colors.surface }]}>
              <View style={[
                styles.txIcon,
                { backgroundColor: tx.type === 'buy' ? colors.income + '22' : colors.expense + '22' },
              ]}>
                {tx.type === 'buy'
                  ? <TrendingUp size={16} color={colors.income} />
                  : <TrendingDown size={16} color={colors.expense} />
                }
              </View>
              <View style={styles.txInfo}>
                <Text style={[styles.txTicker, { color: colors.text }]}>
                  {tx.type === 'buy' ? t('investments.buy') : t('investments.sell')} {asset?.ticker ?? '—'}
                </Text>
                <Text style={[styles.txSub, { color: colors.textSecondary }]}>
                  {tx.quantity % 1 === 0 ? tx.quantity.toFixed(0) : tx.quantity.toFixed(4)} un
                  {' · '}{account?.name ?? '—'}
                </Text>
                <Text style={[styles.txDate, { color: colors.textDisabled }]}>
                  {formatDate(new Date(tx.date.seconds * 1000))}
                </Text>
              </View>
              <Text style={[
                styles.txAmount,
                { color: tx.type === 'buy' ? colors.expense : colors.income },
              ]}>
                {tx.type === 'buy' ? '-' : '+'}{formatCurrency(tx.amount)}
              </Text>
            </View>
          );
        })}
        {hasMore && (
          <Pressable onPress={loadMore} style={styles.loadMoreBtn}>
            <Text style={[styles.loadMoreText, { color: colors.primary }]}>
              {t('common.loadMore')}
            </Text>
          </Pressable>
        )}
      </>
    );
  }

  function renderScheduled() {
    if (scheduled.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('investments.noScheduled')}
          </Text>
        </View>
      );
    }
    return (
      <>
        {scheduled.map((item) => {
          const asset = assets.find((a) => a.id === item.asset_id);
          const acc = accounts.find((a) => a.id === item.account_id);
          return (
            <Pressable
              key={item.id}
              onPress={() => setEditScheduled(item)}
              style={({ pressed }) => [
                styles.txRow,
                { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[
                styles.txIcon,
                { backgroundColor: item.type === 'buy' ? colors.income + '22' : colors.expense + '22' },
              ]}>
                <CalendarClock size={16} color={item.type === 'buy' ? colors.income : colors.expense} />
              </View>
              <View style={styles.txInfo}>
                <Text style={[styles.txTicker, { color: colors.text }]}>
                  {item.type === 'buy' ? t('investments.buy') : t('investments.sell')} {asset?.ticker ?? '—'}
                </Text>
                <Text style={[styles.txSub, { color: colors.textSecondary }]}>
                  {t(`modalScheduledTxn.${item.recurrence}`)} · {acc?.name ?? '—'}
                </Text>
                <Text style={[styles.txDate, { color: colors.textDisabled }]}>
                  {t('investments.nextOn')} {formatDate(new Date(item.next_date.seconds * 1000))}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color: colors.text }]}>
                {formatCurrency(item.amount)}
              </Text>
            </Pressable>
          );
        })}
      </>
    );
  }

  const hasAssets = assets.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Portfolio value card */}
        <View style={[styles.valueCard, { backgroundColor: colors.surface }]}>
          <View style={styles.valueHeader}>
            <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
              {t('investments.portfolioValue')}
            </Text>
            <Pressable onPress={fetchPrices} hitSlop={8} disabled={pricesLoading}>
              {pricesLoading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <RefreshCw size={16} color={colors.textSecondary} />
              }
            </Pressable>
          </View>
          <Text style={[styles.valueAmount, { color: colors.text }]}>
            {formatCurrency(portfolioValue)}
          </Text>
          <Text style={[styles.valueAssets, { color: colors.textSecondary }]}>
            {assets.length} {assets.length === 1 ? t('investments.asset') : t('investments.assets')}
          </Text>
        </View>

        {/* Chart */}
        {snapshots.length >= 2 && (
          <View style={styles.chartWrap}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {t('investments.evolution')}
            </Text>

            {/* Period selector */}
            <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
              {CHART_PERIODS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => { setChartPeriod(p); setChartOffset(0); }}
                  style={[styles.periodBtn, chartPeriod === p && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.periodBtnText, {
                    color: chartPeriod === p ? colors.primaryForeground : colors.textSecondary,
                  }]}>
                    {t(`investments.period${p === 'all' ? 'All' : p.toUpperCase()}` as any)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Date navigation */}
            {chartPeriod !== 'all' && (
              <View style={[styles.dateNavRow, { backgroundColor: colors.surface }]}>
                <Pressable onPress={() => setChartOffset((o) => o - 1)} hitSlop={8} style={styles.navBtn}>
                  <ChevronLeft size={18} color={colors.text} />
                </Pressable>
                <Text style={[styles.dateLabel, { color: colors.text }]} numberOfLines={1}>
                  {rangeLabel}
                </Text>
                <Pressable
                  onPress={() => setChartOffset((o) => o + 1)}
                  hitSlop={8}
                  style={styles.navBtn}
                  disabled={chartOffset >= 0}
                >
                  <ChevronRight size={18} color={chartOffset >= 0 ? colors.textDisabled : colors.text} />
                </Pressable>
              </View>
            )}

            {chartPoints.length >= 2
              ? <InvestmentLineChart points={chartPoints} width={chartWidth} height={180} />
              : (
                <View style={[styles.chartEmpty, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.chartEmptyText, { color: colors.textSecondary }]}>
                    {t('analytics.noData')}
                  </Text>
                </View>
              )
            }
          </View>
        )}

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {(['portfolio', 'history', 'scheduled'] as Tab[]).map((t2) => (
            <Pressable
              key={t2}
              onPress={() => setTab(t2)}
              style={[styles.tabBtn, tab === t2 && [styles.tabActive, { borderBottomColor: colors.primary }]]}
            >
              <Text style={[styles.tabText, { color: tab === t2 ? colors.primary : colors.textSecondary }]}>
                {t(`investments.tab${t2.charAt(0).toUpperCase() + t2.slice(1)}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.tabContent}>
          {tab === 'portfolio' && renderAssets()}
          {tab === 'history' && renderHistory()}
          {tab === 'scheduled' && renderScheduled()}
        </View>
      </ScrollView>

      {/* FABs */}
      <View style={styles.fabGroup}>
        <Pressable
          onPress={() => setShowAddScheduled(true)}
          style={({ pressed }) => [styles.fabSmall, { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.8 : 1 }]}
        >
          <CalendarClock size={20} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={() => setShowSell(true)}
          disabled={!hasAssets}
          style={({ pressed }) => [
            styles.fabSmall,
            { backgroundColor: colors.surfaceAlt, opacity: (!hasAssets || pressed) ? 0.5 : 1 },
          ]}
        >
          <TrendingDown size={20} color={colors.expense} />
        </Pressable>
        <Pressable
          onPress={() => setShowBuy(true)}
          disabled={!hasAssets}
          style={({ pressed }) => [
            styles.fabSmall,
            { backgroundColor: colors.surfaceAlt, opacity: (!hasAssets || pressed) ? 0.5 : 1 },
          ]}
        >
          <TrendingUp size={20} color={colors.income} />
        </Pressable>
        <Pressable
          onPress={() => setShowAddAsset(true)}
          style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
        >
          <Plus size={26} color="#fff" />
        </Pressable>
      </View>

      {/* Modals */}
      {account && (
        <>
          <AddInvestmentAssetModal
            visible={showAddAsset}
            investmentAccountId={account.id}
            existingTickers={assets.map((a) => a.ticker)}
            onClose={() => setShowAddAsset(false)}
          />
          <BuyAssetModal
            visible={showBuy}
            investmentAccountId={account.id}
            assets={assets}
            accounts={accounts}
            onClose={() => setShowBuy(false)}
          />
          <SellAssetModal
            visible={showSell}
            investmentAccountId={account.id}
            assets={assets}
            accounts={accounts}
            prices={prices}
            onClose={() => setShowSell(false)}
          />
          <AddScheduledInvestmentModal
            visible={showAddScheduled}
            investmentAccountId={account.id}
            assets={assets}
            accounts={accounts}
            onClose={() => setShowAddScheduled(false)}
          />
          <EditScheduledInvestmentModal
            item={editScheduled}
            assets={assets}
            accounts={accounts}
            onClose={() => setEditScheduled(null)}
          />
          <ConfirmModal
            visible={!!removeAsset}
            title={t('investments.removeAssetTitle')}
            message={t('investments.removeAssetMsg', { ticker: removeAsset?.ticker ?? '' })}
            confirmLabel={t('common.delete')}
            onConfirm={handleConfirmRemove}
            onCancel={() => { setRemoveAsset(null); setRemoveError(''); }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 100 },
  valueCard: {
    borderRadius: 18, padding: 20, marginBottom: 12,
  },
  valueHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
  },
  valueLabel: { fontSize: 13, fontWeight: '500' },
  valueAmount: { fontSize: 32, fontWeight: '800', marginBottom: 2 },
  valueAssets: { fontSize: 13 },
  chartWrap: { marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  periodRow: {
    flexDirection: 'row', borderRadius: 14,
    padding: 4, gap: 4, marginBottom: 8,
  },
  periodBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10,
  },
  periodBtnText: { fontSize: 12, fontWeight: '600' },
  dateNavRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, paddingHorizontal: 8, paddingVertical: 10, marginBottom: 8,
  },
  navBtn: { padding: 4 },
  dateLabel: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600' },
  chartEmpty: {
    height: 180, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  chartEmptyText: { fontSize: 14 },
  tabs: {
    flexDirection: 'row', borderBottomWidth: 1, borderRadius: 0,
    marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 12,
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: { fontSize: 13, fontWeight: '600' },
  tabContent: {},
  loader: { marginTop: 32 },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 15 },
  txRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, marginBottom: 8, gap: 12,
  },
  txIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txTicker: { fontSize: 14, fontWeight: '600' },
  txSub: { fontSize: 12, marginTop: 2 },
  txDate: { fontSize: 11, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  removeError: { fontSize: 13, marginBottom: 10, paddingHorizontal: 4 },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontWeight: '600' },
  fabGroup: {
    position: 'absolute', bottom: 24, right: 24,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabSmall: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18, shadowRadius: 3,
  },
});
