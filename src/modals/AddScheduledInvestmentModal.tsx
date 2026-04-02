import { useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, ScrollView, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, ChevronRight, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { createScheduledInvestmentTransaction } from '@/api/scheduledInvestmentTransactions';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { amountToCents, formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { InvestmentAsset, Account, Recurrence } from '@/types/models';

const RECURRENCES: Recurrence[] = ['once', 'weekly', 'monthly', 'yearly'];

interface Props {
  visible: boolean;
  investmentAccountId: string;
  assets: InvestmentAsset[];
  accounts: Account[];
  onClose: () => void;
}

export function AddScheduledInvestmentModal({
  visible, investmentAccountId, assets, accounts, onClose,
}: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [opType, setOpType] = useState<'buy' | 'sell'>('buy');
  const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('monthly');
  const [nextDate, setNextDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setOpType('buy'); setSelectedAsset(null); setSelectedAccount(null);
    setAmount(''); setRecurrence('monthly'); setNextDate(new Date());
    setEndDate(null); setDescription(''); setError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    if (!selectedAsset) { setError(t('investments.selectAsset')); return; }
    if (!selectedAccount) { setError(t('modalTransaction.selectAccount')); return; }
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError(t('common.invalidAmount')); return; }

    setError('');
    setLoading(true);
    try {
      await createScheduledInvestmentTransaction(user!.uid, {
        investment_account_id: investmentAccountId,
        asset_id: selectedAsset.id,
        account_id: selectedAccount.id,
        type: opType,
        amount: cents,
        recurrence,
        next_date: nextDate,
        end_date: endDate,
        description: description.trim() || null,
      });
      handleClose();
    } catch {
      setError(t('investments.errorSchedule'));
    } finally {
      setLoading(false);
    }
  }

  const eligibleAssets = opType === 'sell' ? assets.filter((a) => a.quantity > 0) : assets;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('investments.scheduleTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            {/* Buy / Sell toggle */}
            <View style={styles.typeRow}>
              {(['buy', 'sell'] as const).map((tp) => (
                <Pressable
                  key={tp}
                  onPress={() => { setOpType(tp); setSelectedAsset(null); }}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: opType === tp ? colors.primary : colors.surface,
                      borderColor: opType === tp ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {tp === 'buy'
                    ? <TrendingUp size={16} color={opType === tp ? '#fff' : colors.textSecondary} />
                    : <TrendingDown size={16} color={opType === tp ? '#fff' : colors.textSecondary} />
                  }
                  <Text style={{ color: opType === tp ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
                    {opType === tp ? t(`investments.${tp}`) : t(`investments.${tp}`)}
                  </Text>
                </Pressable>
              ))}
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
              {opType === 'buy' ? t('investments.debitAccount') : t('investments.creditAccount')}
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
                  style={[
                    styles.recBtn,
                    {
                      backgroundColor: recurrence === r ? colors.primary : colors.surface,
                      borderColor: recurrence === r ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: recurrence === r ? '#fff' : colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                    {t(`modalScheduledTxn.${r}`)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Next date */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalScheduledTxn.startDate')}</Text>
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
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t('investments.scheduleBtn')}</Text>
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
      <DatePickerModal
        visible={showNextDatePicker}
        selected={nextDate}
        onSelect={setNextDate}
        onClose={() => setShowNextDatePicker(false)}
        allowFuture
      />
      <DatePickerModal
        visible={showEndDatePicker}
        selected={endDate ?? nextDate}
        onSelect={setEndDate}
        onClose={() => setShowEndDatePicker(false)}
        allowFuture
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
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
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
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
