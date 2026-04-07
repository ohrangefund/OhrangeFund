import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  ShoppingCart, Utensils, Car, Home, HeartPulse, GraduationCap,
  Zap, Plane, Coffee, Briefcase, TrendingUp, TrendingDown, Gift, PiggyBank,
  Banknote, Wallet, Dumbbell, Shirt, Music,
  X, ChevronRight, CalendarDays,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/hooks/useCategories';
import { updateTransaction, deleteTransaction } from '@/api/transactions';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SelectCategoryModal } from '@/components/ui/SelectCategoryModal';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { amountToCents, centsToAmount } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { Timestamp } from 'firebase/firestore';
import type { Transaction, Account } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'shopping-cart': ShoppingCart, 'utensils': Utensils, 'car': Car,
  'home': Home, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap,
  'zap': Zap, 'plane': Plane, 'coffee': Coffee, 'briefcase': Briefcase,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'gift': Gift,
  'piggy-bank': PiggyBank, 'banknote': Banknote, 'wallet': Wallet,
  'dumbbell': Dumbbell, 'shirt': Shirt, 'music': Music,
};

interface Props {
  transaction: Transaction | null;
  account: Account;
  accounts: Account[];
  sharedAccounts?: Account[];
  onClose: () => void;
}

export function EditTransactionModal({ transaction, account, accounts, sharedAccounts = [], onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { incomeCategories, expenseCategories } = useCategories();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedAccount, setSelectedAccount] = useState<Account>(account);
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const selectedCategory = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(centsToAmount(transaction.amount).toFixed(2).replace('.', ','));
      setCategoryId(transaction.category_id);
      setSelectedDate(transaction.date instanceof Date ? transaction.date : transaction.date.toDate());
      setDescription(transaction.description);
      setSelectedAccount([...accounts, ...sharedAccounts].find((a) => a.id === transaction.account_id) ?? account);
      setError('');
    }
  }, [transaction, accounts, account]);

  const isShared = sharedAccounts.some((a) => a.id === selectedAccount.id);

  async function handleSave() {
    if (!transaction) return;
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError(t('common.invalidAmount')); return; }
    if (!categoryId) { setError(t('modalTransaction.selectCategory')); return; }
    if (isShared && !description.trim()) { setError(t('modalTransaction.descRequired')); return; }

    setError('');
    setLoading(true);
    try {
      await updateTransaction(
        transaction.id,
        transaction.account_id,
        { type: transaction.type, amount: transaction.amount },
        selectedAccount.id,
        { category_id: categoryId, type, amount: cents, description: description.trim(), date: selectedDate },
      );
      onClose();
    } catch {
      setError(t('common.errorSave'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;
    setLoading(true);
    try {
      await deleteTransaction(transaction.id, account.id, transaction.type, transaction.amount);
      onClose();
    } catch {
      setError(t('common.errorDelete'));
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={!!transaction} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('modalTransaction.editTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
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
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: type === txnType ? colors.primary : colors.surface,
                      borderColor: type === txnType ? colors.primary : colors.border,
                    },
                  ]}
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
              <View style={styles.selectorContent}>
                <View style={[styles.selectorIcon, { backgroundColor: selectedAccount.color + '22' }]}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedAccount.color }} />
                </View>
                <Text style={[styles.selectorText, { color: colors.text }]}>{selectedAccount.name}</Text>
              </View>
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
              placeholder={t('modalTransaction.descPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
            />

          </ScrollView>

          <View style={[styles.dangerSection, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => setShowConfirm(true)} style={styles.dangerBtn}>
              <Text style={[styles.dangerText, { color: colors.error }]}>{t('modalTransaction.deleteBtn')}</Text>
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

      <SelectAccountModal
        visible={showAccountPicker}
        accounts={accounts}
        sharedAccounts={sharedAccounts}
        selectedId={selectedAccount.id}
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
        visible={showDatePicker}
        selected={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setShowDatePicker(false)}
      />

      <ConfirmModal
        visible={showConfirm}
        title={t('modalTransaction.deleteTitle')}
        message={t('modalTransaction.deleteMsg')}
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
  dangerSection: { marginTop: 32, borderTopWidth: 1, paddingTop: 16 },
  dangerBtn: { paddingVertical: 16, alignItems: 'center' },
  dangerText: { fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
