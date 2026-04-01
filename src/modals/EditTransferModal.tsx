import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, CalendarDays, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { updateTransfer, deleteTransfer } from '@/api/transfers';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { amountToCents, centsToAmount } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { Transfer } from '@/types/models';

interface Props {
  transfer: Transfer | null;
  onClose: () => void;
}

export function EditTransferModal({ transfer, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { accounts } = useAccounts();

  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fromAccount = accounts.find((a) => a.id === transfer?.from_account_id);
  const toAccount = accounts.find((a) => a.id === transfer?.to_account_id);

  useEffect(() => {
    if (transfer) {
      setAmount(centsToAmount(transfer.amount).toFixed(2).replace('.', ','));
      setSelectedDate(transfer.date.toDate());
      setDescription(transfer.description);
      setError('');
    }
  }, [transfer]);

  async function handleSave() {
    if (!transfer) return;
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError(t('common.invalidAmount')); return; }

    setError('');
    setLoading(true);
    try {
      await updateTransfer(
        transfer.id,
        { from_account_id: transfer.from_account_id, to_account_id: transfer.to_account_id, amount: transfer.amount },
        { amount: cents, description: description.trim(), date: selectedDate },
      );
      onClose();
    } catch {
      setError(t('common.errorSave'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!transfer) return;
    setLoading(true);
    try {
      await deleteTransfer(transfer.id, transfer.from_account_id, transfer.to_account_id, transfer.amount);
      onClose();
    } catch {
      setError(t('common.errorDelete'));
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={!!transfer} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('modalTransfer.editTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            {/* De → Para (informativo) */}
            <View style={[styles.routeCard, { backgroundColor: colors.surface }]}>
              <View style={styles.routeAccount}>
                {fromAccount && <View style={[styles.accountDot, { backgroundColor: fromAccount.color }]} />}
                <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                  {fromAccount?.name ?? '—'}
                </Text>
              </View>
              <Text style={[styles.routeArrow, { color: colors.textSecondary }]}>→</Text>
              <View style={styles.routeAccount}>
                {toAccount && <View style={[styles.accountDot, { backgroundColor: toAccount.color }]} />}
                <Text style={[styles.routeText, { color: colors.text }]} numberOfLines={1}>
                  {toAccount?.name ?? '—'}
                </Text>
              </View>
            </View>

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

            {/* Data */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.date')}</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <CalendarDays size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={[styles.selectorText, { color: colors.text }]}>
                {formatDate(selectedDate)}
              </Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Descrição */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.description')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={t('modalTransfer.descPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
            />
          </ScrollView>

          <View style={[styles.dangerSection, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => setShowConfirm(true)} style={styles.dangerBtn}>
              <Text style={[styles.dangerText, { color: colors.error }]}>{t('modalTransfer.deleteBtn')}</Text>
            </Pressable>
          </View>

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

      <DatePickerModal
        visible={showDatePicker}
        selected={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setShowDatePicker(false)}
      />
      <ConfirmModal
        visible={showConfirm}
        title={t('modalTransfer.deleteTitle')}
        message={t('modalTransfer.deleteMsg')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
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
  routeCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 16, gap: 8,
  },
  routeAccount: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountDot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { flex: 1, fontSize: 15, fontWeight: '500' },
  routeArrow: { fontSize: 18 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  selector: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  selectorText: { flex: 1, fontSize: 16 },
  dangerSection: { borderTopWidth: 1 },
  dangerBtn: { paddingVertical: 16, alignItems: 'center' },
  dangerText: { fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
