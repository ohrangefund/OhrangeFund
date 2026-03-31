import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  ShoppingCart, Utensils, Car, Home, HeartPulse, GraduationCap,
  Zap, Plane, Coffee, Briefcase, TrendingUp, TrendingDown, Gift, PiggyBank,
  Banknote, Wallet, Dumbbell, Shirt, Music, X, ChevronRight, CalendarDays,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/hooks/useCategories';
import { updateScheduledTransaction, deleteScheduledTransaction } from '@/api/scheduledTransactions';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SelectCategoryModal } from '@/components/ui/SelectCategoryModal';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { amountToCents, centsToAmount } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { ScheduledTransaction, Account, Recurrence } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'shopping-cart': ShoppingCart, 'utensils': Utensils, 'car': Car,
  'home': Home, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap,
  'zap': Zap, 'plane': Plane, 'coffee': Coffee, 'briefcase': Briefcase,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'gift': Gift,
  'piggy-bank': PiggyBank, 'banknote': Banknote, 'wallet': Wallet,
  'dumbbell': Dumbbell, 'shirt': Shirt, 'music': Music,
};

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: 'once', label: 'Uma vez' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'yearly', label: 'Anual' },
];

interface Props {
  item: ScheduledTransaction | null;
  accounts: Account[];
  onClose: () => void;
}

export function EditScheduledTransactionModal({ item, accounts, onClose }: Props) {
  const { colors } = useTheme();
  const { incomeCategories, expenseCategories } = useCategories();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [recurrence, setRecurrence] = useState<Recurrence>('monthly');
  const [nextDate, setNextDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const selectedCategory = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    if (item) {
      setType(item.type);
      setAmount(centsToAmount(item.amount).toFixed(2).replace('.', ','));
      setCategoryId(item.category_id);
      setSelectedAccount(accounts.find((a) => a.id === item.account_id) ?? null);
      setRecurrence(item.recurrence);
      setNextDate(item.next_date.toDate());
      setEndDate(item.end_date ? item.end_date.toDate() : null);
      setDescription(item.description ?? '');
      setError('');
    }
  }, [item, accounts]);

  async function handleSave() {
    if (!item) return;
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError('Valor inválido.'); return; }
    if (!categoryId) { setError('Seleciona uma categoria.'); return; }
    if (!selectedAccount) { setError('Seleciona uma conta.'); return; }

    setError('');
    setLoading(true);
    try {
      await updateScheduledTransaction(item.id, {
        account_id: selectedAccount.id,
        category_id: categoryId,
        type,
        amount: cents,
        description: description.trim(),
        recurrence,
        next_date: nextDate,
        end_date: recurrence === 'once' ? null : endDate,
      });
      onClose();
    } catch {
      setError('Erro ao guardar. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    setLoading(true);
    try {
      await deleteScheduledTransaction(item.id);
      onClose();
    } catch {
      setError('Erro ao apagar. Tenta novamente.');
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={!!item} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Editar agendamento</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            {/* Tipo */}
            <View style={styles.typeRow}>
              {(['expense', 'income'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setType(t); setCategoryId(''); }}
                  style={[styles.typeBtn, { backgroundColor: type === t ? colors.primary : colors.surface, borderColor: type === t ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: type === t ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
                    {t === 'expense' ? 'Despesa' : 'Receita'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Conta */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Conta</Text>
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
                <Text style={[styles.selectorText, { color: colors.textDisabled }]}>Selecionar conta</Text>
              )}
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Valor */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Valor (€)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textDisabled}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            {/* Categoria */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Categoria</Text>
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
                <Text style={[styles.selectorText, { color: colors.textDisabled }]}>Selecionar categoria</Text>
              )}
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Recorrência */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Recorrência</Text>
            <View style={styles.recurrenceRow}>
              {RECURRENCES.map(({ value, label }) => (
                <Pressable
                  key={value}
                  onPress={() => setRecurrence(value)}
                  style={[styles.recurrenceBtn, { backgroundColor: recurrence === value ? colors.primary : colors.surface, borderColor: recurrence === value ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: recurrence === value ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Próxima data */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Próxima execução</Text>
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Data de fim (opcional)</Text>
                <Pressable
                  onPress={() => setShowEndDatePicker(true)}
                  style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
                >
                  <CalendarDays size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={[styles.selectorText, { color: endDate ? colors.text : colors.textDisabled }]}>
                    {endDate ? formatDate(endDate) : 'Sem data de fim'}
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
            <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Ex: Subscrição Netflix"
              placeholderTextColor={colors.textDisabled}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
            />
          </ScrollView>

          <View style={[styles.dangerSection, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => setShowConfirm(true)} style={styles.dangerBtn}>
              <Text style={[styles.dangerText, { color: colors.error }]}>Apagar agendamento</Text>
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
                : <Text style={styles.submitText}>Guardar</Text>
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
        title="Selecionar categoria"
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
      <ConfirmModal
        visible={showConfirm}
        title="Apagar agendamento"
        message="O agendamento será removido. As transações já criadas não são afetadas."
        confirmLabel="Apagar"
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
  recurrenceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurrenceBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  dangerSection: { borderTopWidth: 1, paddingTop: 4 },
  dangerBtn: { paddingVertical: 16, alignItems: 'center' },
  dangerText: { fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
