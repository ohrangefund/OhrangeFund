import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, ChevronRight, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  updateScheduledInvestmentTransaction,
  deleteScheduledInvestmentTransaction,
} from '@/api/scheduledInvestmentTransactions';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { amountToCents, centsToAmount, formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { ScheduledInvestmentTransaction, InvestmentAsset, Account, Recurrence } from '@/types/models';

const RECURRENCES: Recurrence[] = ['once', 'weekly', 'monthly', 'yearly'];

interface Props {
  item: ScheduledInvestmentTransaction | null;
  assets: InvestmentAsset[];
  accounts: Account[];
  onClose: () => void;
}

export function EditScheduledInvestmentModal({ item, assets, accounts, onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const visible = !!item;

  const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('monthly');
  const [nextDate, setNextDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!item) return;
    setSelectedAsset(assets.find((a) => a.id === item.asset_id) ?? null);
    setSelectedAccount(accounts.find((a) => a.id === item.account_id) ?? null);
    setAmount(centsToAmount(item.amount).toFixed(2).replace('.', ','));
    setRecurrence(item.recurrence);
    setNextDate(new Date(item.next_date.seconds * 1000));
    setEndDate(item.end_date ? new Date(item.end_date.seconds * 1000) : null);
    setDescription(item.description ?? '');
    setError('');
  }, [item, assets, accounts]);

  async function handleSave() {
    if (!item || !user) return;
    if (!selectedAsset) { setError(t('investments.selectAsset')); return; }
    if (!selectedAccount) { setError(t('modalTransaction.selectAccount')); return; }
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError(t('common.invalidAmount')); return; }

    setError('');
    setLoading(true);
    try {
      await updateScheduledInvestmentTransaction(item.id, {
        asset_id: selectedAsset.id,
        account_id: selectedAccount.id,
        type: item.type,
        amount: cents,
        recurrence,
        next_date: nextDate,
        end_date: endDate,
        description: description.trim() || null,
      });
      onClose();
    } catch {
      setError(t('common.errorSave'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    setLoading(true);
    try {
      await deleteScheduledInvestmentTransaction(item.id);
      onClose();
    } catch {
      setError(t('common.errorDelete'));
    } finally {
      setLoading(false);
    }
  }

  const eligibleAssets = item?.type === 'sell' ? assets.filter((a) => a.quantity > 0) : assets;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('investments.editScheduleTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8}><X size={22} color={colors.textSecondary} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            {/* Op type badge (read-only) */}
            <View style={[styles.typeBadge, { backgroundColor: item?.type === 'buy' ? colors.income + '22' : colors.expense + '22' }]}>
              {item?.type === 'buy'
                ? <TrendingUp size={14} color={colors.income} />
                : <TrendingDown size={14} color={colors.expense} />
              }
              <Text style={[styles.typeBadgeText, { color: item?.type === 'buy' ? colors.income : colors.expense }]}>
                {item?.type === 'buy' ? t('investments.buy') : t('investments.sell')}
              </Text>
            </View>

            {/* Asset */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('investments.assetLabel')}</Text>
            <Pressable
              onPress={() => setShowAssetPicker(true)}
              style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {selectedAsset
                ? <Text style={[styles.selectorText, { color: colors.text }]}>{selectedAsset.ticker} — {selectedAsset.name}</Text>
                : <Text style={[styles.selectorText, { color: colors.textDisabled }]}>{t('investments.selectAsset')}</Text>
              }
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Account */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {item?.type === 'buy' ? t('investments.debitAccount') : t('investments.creditAccount')}
            </Text>
            <Pressable
              onPress={() => setShowAccountPicker(true)}
              style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {selectedAccount ? (
                <View style={styles.selectorContent}>
                  <View style={[styles.selectorIcon, { backgroundColor: selectedAccount.color + '22' }]}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedAccount.color }} />
                  </View>
                  <Text style={[styles.selectorText, { color: colors.text }]}>{selectedAccount.name}</Text>
                </View>
              ) : (
                <Text style={[styles.selectorText, { color: colors.textDisabled }]}>{t('common.selectAccount')}</Text>
              )}
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Amount */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.amount')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textDisabled}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            {/* Recurrence */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalScheduledTxn.recurrence')}</Text>
            <View style={styles.recRow}>
              {RECURRENCES.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRecurrence(r)}
                  style={[styles.recBtn, { backgroundColor: recurrence === r ? colors.primary : colors.surface, borderColor: recurrence === r ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: recurrence === r ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    {t(`modalScheduledTxn.${r}`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Next date */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalScheduledTxn.nextExecution')}</Text>
            <Pressable
              onPress={() => setShowNextDatePicker(true)}
              style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <CalendarDays size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={[styles.selectorText, { color: colors.text }]}>{formatDate(nextDate)}</Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* End date */}
            {recurrence !== 'once' && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalScheduledTxn.endDate')}</Text>
                <Pressable
                  onPress={() => setShowEndDatePicker(true)}
                  style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                >
                  <CalendarDays size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={[styles.selectorText, { color: endDate ? colors.text : colors.textDisabled }]}>
                    {endDate ? formatDate(endDate) : t('common.noEndDate')}
                  </Text>
                  <ChevronRight size={16} color={colors.textSecondary} />
                </Pressable>
                {endDate && (
                  <Pressable onPress={() => setEndDate(null)} style={styles.clearDate}>
                    <Text style={[styles.clearDateText, { color: colors.error }]}>{t('common.cancel')}</Text>
                  </Pressable>
                )}
              </>
            )}

            {/* Description */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.description')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={t('investments.descPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
            />

            {/* Delete button */}
            <Pressable
              onPress={() => setShowConfirmDelete(true)}
              style={({ pressed }) => [styles.deleteBtn, { borderColor: colors.error, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.deleteBtnText, { color: colors.error }]}>{t('investments.deleteScheduleBtn')}</Text>
            </Pressable>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSave}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t('common.save')}</Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Asset picker */}
      <Modal visible={showAssetPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAssetPicker(false)}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('investments.selectAsset')}</Text>
            <Pressable onPress={() => setShowAssetPicker(false)} hitSlop={8}><X size={22} color={colors.textSecondary} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            {eligibleAssets.map((asset) => (
              <Pressable
                key={asset.id}
                onPress={() => { setSelectedAsset(asset); setShowAssetPicker(false); }}
                style={({ pressed }) => [
                  styles.assetRow,
                  { backgroundColor: selectedAsset?.id === asset.id ? colors.primary + '18' : colors.surface, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={[styles.assetTicker, { color: colors.text }]}>{asset.ticker}</Text>
                <Text style={[styles.assetName, { color: colors.textSecondary }]}>{asset.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <SelectAccountModal
        visible={showAccountPicker}
        accounts={accounts}
        selectedId={selectedAccount?.id ?? null}
        onSelect={(a) => { setSelectedAccount(a); setShowAccountPicker(false); }}
        onClose={() => setShowAccountPicker(false)}
        showTotal={false}
      />
      <DatePickerModal visible={showNextDatePicker} selected={nextDate} onSelect={setNextDate} onClose={() => setShowNextDatePicker(false)} allowFuture />
      <DatePickerModal visible={showEndDatePicker} selected={endDate ?? nextDate} onSelect={setEndDate} onClose={() => setShowEndDatePicker(false)} allowFuture />
      <ConfirmModal
        visible={showConfirmDelete}
        title={t('investments.deleteScheduleTitle')}
        message={t('investments.deleteScheduleMsg')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 8 },
  error: { fontSize: 14, marginBottom: 12 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 4 },
  typeBadgeText: { fontSize: 13, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  selector: { borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' },
  selectorContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  selectorIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  selectorText: { flex: 1, fontSize: 16 },
  recRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  recBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  clearDate: { alignSelf: 'flex-end', marginTop: 4 },
  clearDateText: { fontSize: 13 },
  assetRow: { borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetTicker: { fontSize: 15, fontWeight: '700', width: 60 },
  assetName: { flex: 1, fontSize: 14 },
  deleteBtn: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
