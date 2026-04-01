import { useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  ShoppingCart, Utensils, Car, Home, HeartPulse, GraduationCap,
  Zap, Plane, Coffee, Briefcase, TrendingUp, TrendingDown, Gift, PiggyBank,
  Banknote, Wallet, Dumbbell, Shirt, Music, X, ChevronRight, CalendarDays,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { createScheduledTransaction } from '@/api/scheduledTransactions';
import { SelectCategoryModal } from '@/components/ui/SelectCategoryModal';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { amountToCents } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { Account, Recurrence } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'shopping-cart': ShoppingCart, 'utensils': Utensils, 'car': Car,
  'home': Home, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap,
  'zap': Zap, 'plane': Plane, 'coffee': Coffee, 'briefcase': Briefcase,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'gift': Gift,
  'piggy-bank': PiggyBank, 'banknote': Banknote, 'wallet': Wallet,
  'dumbbell': Dumbbell, 'shirt': Shirt, 'music': Music,
};

const RECURRENCES: Recurrence[] = ['once', 'weekly', 'monthly', 'yearly'];

interface Props {
  visible: boolean;
  accounts: Account[];
  initialType?: 'income' | 'expense';
  onClose: () => void;
}

export function AddScheduledTransactionModal({ visible, accounts, initialType = 'expense', onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { incomeCategories, expenseCategories } = useCategories();

  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(accounts[0] ?? null);
  const [recurrence, setRecurrence] = useState<Recurrence>('monthly');
  const [nextDate, setNextDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const selectedCategory = categories.find((c) => c.id === categoryId);

  function reset() {
    setType(initialType); setAmount(''); setCategoryId('');
    setSelectedAccount(accounts[0] ?? null); setRecurrence('monthly');
    setNextDate(new Date()); setEndDate(null); setDescription(''); setError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError(t('common.invalidAmount')); return; }
    if (!categoryId) { setError(t('modalTransaction.selectCategory')); return; }
    if (!selectedAccount) { setError(t('modalTransaction.selectAccount')); return; }

    setError('');
    setLoading(true);
    try {
      await createScheduledTransaction(user!.uid, {
        account_id: selectedAccount.id,
        category_id: categoryId,
        type,
        amount: cents,
        description: description.trim(),
        recurrence,
        next_date: nextDate,
        end_date: recurrence === 'once' ? null : endDate,
      });
      handleClose();
    } catch {
      setError(t('modalScheduledTxn.errorCreate'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('modalScheduledTxn.addTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            {/* Tipo */}
            <View style={styles.typeRow}>
              {(['expense', 'income'] as const).map((txnType) => (
                <Pressable
                  key={txnType}
                  onPress={() => { setType(txnType); setCategoryId(''); }}
                  style={[styles.typeBtn, { backgroundColor: type === txnType ? colors.primary : colors.surface, borderColor: type === txnType ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: type === txnType ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
                    {txnType === 'expense' ? t('modalTransaction.expense') : t('modalTransaction.income')}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Conta */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.account')}</Text>
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

            {/* Categoria */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.category')}</Text>
            <Pressable
              onPress={() => setShowCategoryPicker(true)}
              style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {selectedCategory ? (() => {
                const Icon = ICONS[selectedCategory.icon] ?? ShoppingCart;
                return (
                  <View style={styles.selectorContent}>
                    <View style={[styles.selectorIcon, { backgroundColor: selectedCategory.color + '22' }]}>
                      <Icon size={16} color={selectedCategory.color} />
                    </View>
                    <Text style={[styles.selectorText, { color: colors.text }]}>{selectedCategory.name}</Text>
                  </View>
                );
              })() : (
                <Text style={[styles.selectorText, { color: colors.textDisabled }]}>{t('common.selectCategory')}</Text>
              )}
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Recorrência */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalScheduledTxn.recurrence')}</Text>
            <View style={styles.recurrenceRow}>
              {RECURRENCES.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setRecurrence(value)}
                  style={[styles.recurrenceBtn, { backgroundColor: recurrence === value ? colors.primary : colors.surface, borderColor: recurrence === value ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: recurrence === value ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    {t(`modalScheduledTxn.${value}` as any)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Próxima data */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalScheduledTxn.startDate')}</Text>
            <Pressable
              onPress={() => setShowNextDatePicker(true)}
              style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <CalendarDays size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={[styles.selectorText, { color: colors.text }]}>{formatDate(nextDate)}</Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Data de fim (só para recorrentes) */}
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
              placeholder={t('modalScheduledTxn.descPlaceholder')}
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
                : <Text style={styles.submitText}>{t('modalScheduledTxn.createBtn')}</Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <SelectAccountModal
        visible={showAccountPicker}
        accounts={accounts}
        selectedId={selectedAccount?.id ?? null}
        onSelect={(a) => { setSelectedAccount(a); setShowAccountPicker(false); }}
        onClose={() => setShowAccountPicker(false)}
        showTotal={false}
      />
      <SelectCategoryModal
        visible={showCategoryPicker}
        title={t('common.selectCategory')}
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        onClose={() => setShowCategoryPicker(false)}
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
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  selector: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  selectorContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  selectorIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  selectorText: { flex: 1, fontSize: 16 },
  recurrenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurrenceBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
