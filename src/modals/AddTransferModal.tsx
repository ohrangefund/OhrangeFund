import { useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, ChevronRight, CalendarDays } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { createTransfer } from '@/api/transfers';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { amountToCents } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { Account } from '@/types/models';

interface Props {
  visible: boolean;
  fromAccount?: Account | null;
  onClose: () => void;
}

export function AddTransferModal({ visible, fromAccount, onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { accounts } = useAccounts();

  const [amount, setAmount] = useState('');
  const [fromAccountSelected, setFromAccountSelected] = useState<Account | null>(fromAccount ?? null);
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [description, setDescription] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveFrom = fromAccount ?? fromAccountSelected;
  const destinationAccounts = accounts.filter((a) => a.id !== effectiveFrom?.id);
  const sourceAccounts = accounts.filter((a) => a.id !== toAccount?.id);

  function reset() {
    setAmount(''); setToAccount(null); setFromAccountSelected(fromAccount ?? null);
    setSelectedDate(new Date()); setDescription(''); setError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError(t('common.invalidAmount')); return; }
    if (!effectiveFrom) { setError(t('modalTransfer.selectFrom')); return; }
    if (!toAccount) { setError(t('modalTransfer.selectTo')); return; }

    setError('');
    setLoading(true);
    try {
      await createTransfer(user!.uid, {
        from_account_id: effectiveFrom.id,
        to_account_id: toAccount.id,
        amount: cents,
        description: description.trim(),
        date: selectedDate,
      });
      handleClose();
    } catch {
      setError(t('modalTransfer.errorCreate'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('modalTransfer.addTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            {/* De */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.from')}</Text>
            {fromAccount ? (
              <View style={[styles.staticField, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.accountDot, { backgroundColor: fromAccount.color }]} />
                <Text style={[styles.staticText, { color: colors.text }]}>{fromAccount.name}</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowFromPicker(true)}
                style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
              >
                {fromAccountSelected ? (
                  <View style={styles.selectorContent}>
                    <View style={[styles.accountDot, { backgroundColor: fromAccountSelected.color }]} />
                    <Text style={[styles.selectorText, { color: colors.text }]}>{fromAccountSelected.name}</Text>
                  </View>
                ) : (
                  <Text style={[styles.selectorText, { color: colors.textDisabled }]}>{t('common.selectAccount')}</Text>
                )}
                <ChevronRight size={16} color={colors.textSecondary} />
              </Pressable>
            )}

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

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t('modalTransfer.transferBtn')}</Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SelectAccountModal
        visible={showFromPicker}
        accounts={sourceAccounts}
        selectedId={fromAccountSelected?.id ?? null}
        showTotal={false}
        onSelect={(acc) => { setFromAccountSelected(acc); setShowFromPicker(false); }}
        onClose={() => setShowFromPicker(false)}
      />
      <SelectAccountModal
        visible={showToPicker}
        accounts={destinationAccounts}
        selectedId={toAccount?.id ?? null}
        showTotal={false}
        onSelect={(acc) => { setToAccount(acc); setShowToPicker(false); }}
        onClose={() => setShowToPicker(false)}
      />
      <DatePickerModal
        visible={showDatePicker}
        selected={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setShowDatePicker(false)}
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
  staticField: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  staticText: { fontSize: 16, fontWeight: '500' },
  accountDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  selector: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  selectorContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  selectorText: { flex: 1, fontSize: 16 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
