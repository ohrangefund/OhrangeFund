import { useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, ChevronRight, CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { createScheduledTransfer } from '@/api/scheduledTransfers';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { amountToCents } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { Account, Recurrence } from '@/types/models';

const RECURRENCES: Recurrence[] = ['once', 'weekly', 'monthly', 'yearly'];

interface Props {
  visible: boolean;
  accounts: Account[];
  onClose: () => void;
}

export function AddScheduledTransferModal({ visible, accounts, onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [amount, setAmount] = useState('');
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [recurrence, setRecurrence] = useState<Recurrence>('monthly');
  const [nextDate, setNextDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sourceAccounts = accounts.filter((a) => a.id !== toAccount?.id);
  const destinationAccounts = accounts.filter((a) => a.id !== fromAccount?.id);

  function reset() {
    setAmount(''); setFromAccount(null); setToAccount(null);
    setRecurrence('monthly'); setNextDate(new Date()); setEndDate(null);
    setDescription(''); setError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError(t('common.invalidAmount')); return; }
    if (!fromAccount) { setError(t('modalTransfer.selectFrom')); return; }
    if (!toAccount) { setError(t('modalTransfer.selectTo')); return; }

    setError('');
    setLoading(true);
    try {
      await createScheduledTransfer(user!.uid, {
        from_account_id: fromAccount.id,
        to_account_id: toAccount.id,
        amount: cents,
        description: description.trim(),
        recurrence,
        next_date: nextDate,
        end_date: recurrence === 'once' ? null : endDate,
      });
      handleClose();
    } catch {
      setError(t('modalScheduledTransfer.errorCreate'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('modalScheduledTransfer.addTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            {/* De */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.from')}</Text>
            <Pressable
              onPress={() => setShowFromPicker(true)}
              style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              {fromAccount ? (
                <View style={styles.selectorContent}>
                  <View style={[styles.accountDot, { backgroundColor: fromAccount.color }]} />
                  <Text style={[styles.selectorText, { color: colors.text }]}>{fromAccount.name}</Text>
                </View>
              ) : (
                <Text style={[styles.selectorText, { color: colors.textDisabled }]}>{t('common.selectAccount')}</Text>
              )}
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Para */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.to')}</Text>
            <Pressable
              onPress={() => setShowToPicker(true)}
              style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              {toAccount ? (
                <View style={styles.selectorContent}>
                  <View style={[styles.accountDot, { backgroundColor: toAccount.color }]} />
                  <Text style={[styles.selectorText, { color: colors.text }]}>{toAccount.name}</Text>
                </View>
              ) : (
                <Text style={[styles.selectorText, { color: colors.textDisabled }]}>{t('common.selectAccount')}</Text>
              )}
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Valor */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.amount')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textDisabled}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            {/* Recorrência */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalScheduledTransfer.recurrence')}</Text>
            <View style={styles.recurrenceRow}>
              {RECURRENCES.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setRecurrence(value)}
                  style={[styles.recurrenceBtn, { backgroundColor: recurrence === value ? colors.primary : colors.surface, borderColor: recurrence === value ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: recurrence === value ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    {t(`modalScheduledTransfer.${value}` as any)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Próxima data */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalScheduledTransfer.startDate')}</Text>
            <Pressable
              onPress={() => setShowNextDatePicker(true)}
              style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <CalendarDays size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={[styles.selectorText, { color: colors.text }]}>{formatDate(nextDate)}</Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Data de fim */}
            {recurrence !== 'once' && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalScheduledTransfer.endDate')}</Text>
                <Pressable
                  onPress={() => setShowEndDatePicker(true)}
                  style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                >
                  <CalendarDays size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={[styles.selectorText, { color: endDate ? colors.text : colors.textDisabled }]}>
                    {endDate ? formatDate(endDate) : t('common.noEndDate')}
                  </Text>
                  {endDate && (
                    <Pressable onPress={() => setEndDate(null)} hitSlop={8}>
                      <X size={16} color={colors.textSecondary} />
                    </Pressable>
                  )}
                  {!endDate && <ChevronRight size={16} color={colors.textSecondary} />}
                </Pressable>
              </>
            )}

            {/* Descrição */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.description')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={t('modalScheduledTransfer.descPlaceholder')}
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
                : <Text style={styles.submitText}>{t('modalScheduledTransfer.createBtn')}</Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SelectAccountModal
        visible={showFromPicker}
        accounts={sourceAccounts}
        selectedId={fromAccount?.id ?? null}
        showTotal={false}
        onSelect={(a) => { setFromAccount(a); setShowFromPicker(false); }}
        onClose={() => setShowFromPicker(false)}
      />
      <SelectAccountModal
        visible={showToPicker}
        accounts={destinationAccounts}
        selectedId={toAccount?.id ?? null}
        showTotal={false}
        onSelect={(a) => { setToAccount(a); setShowToPicker(false); }}
        onClose={() => setShowToPicker(false)}
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
        selected={endDate ?? new Date()}
        onSelect={setEndDate}
        onClose={() => setShowEndDatePicker(false)}
        allowFuture
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 8 },
  error: { fontSize: 14, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  selector: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  selectorContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  selectorText: { flex: 1, fontSize: 16 },
  accountDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  recurrenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurrenceBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
