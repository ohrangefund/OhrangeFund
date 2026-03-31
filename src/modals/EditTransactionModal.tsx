import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  ShoppingCart, X, ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/hooks/useCategories';
import { updateTransaction, deleteTransaction } from '@/api/transactions';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SelectCategoryModal } from '@/components/ui/SelectCategoryModal';
import { amountToCents, centsToAmount } from '@/utils/currency';
import { parseDate, formatDate } from '@/utils/date';
import { Timestamp } from 'firebase/firestore';
import type { Transaction, Category, Account } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'shopping-cart': ShoppingCart,
};

interface Props {
  transaction: Transaction | null;
  account: Account;
  onClose: () => void;
}

export function EditTransactionModal({ transaction, account, onClose }: Props) {
  const { colors } = useTheme();
  const { incomeCategories, expenseCategories } = useCategories();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
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
      setDateStr(formatDate(transaction.date));
      setDescription(transaction.description);
      setError('');
    }
  }, [transaction]);

  async function handleSave() {
    if (!transaction) return;
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError('Valor inválido.'); return; }
    if (!categoryId) { setError('Seleciona uma categoria.'); return; }
    const date = parseDate(dateStr);
    if (!date) { setError('Data inválida. Usa o formato DD/MM/AAAA.'); return; }

    setError('');
    setLoading(true);
    try {
      await updateTransaction(
        transaction.id,
        account.id,
        { type: transaction.type, amount: transaction.amount },
        { category_id: categoryId, type, amount: cents, description: description.trim(), date },
      );
      onClose();
    } catch {
      setError('Erro ao guardar. Tenta novamente.');
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
      setError('Erro ao apagar. Tenta novamente.');
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
            <Text style={[styles.title, { color: colors.text }]}>Editar transação</Text>
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
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: type === t ? colors.primary : colors.surface,
                      borderColor: type === t ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: type === t ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
                    {t === 'expense' ? 'Despesa' : 'Receita'}
                  </Text>
                </Pressable>
              ))}
            </View>

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

            {/* Data */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Data</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={colors.textDisabled}
              value={dateStr}
              onChangeText={setDateStr}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* Descrição */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Ex: Supermercado"
              placeholderTextColor={colors.textDisabled}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
            />

          </ScrollView>

          <View style={[styles.dangerSection, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => setShowConfirm(true)} style={styles.dangerBtn}>
              <Text style={[styles.dangerText, { color: colors.error }]}>Apagar transação</Text>
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

      <SelectCategoryModal
        visible={showCategoryPicker}
        title="Selecionar categoria"
        categories={categories}
        selectedId={categoryId}
        onSelect={setCategoryId}
        onClose={() => setShowCategoryPicker(false)}
      />

      <ConfirmModal
        visible={showConfirm}
        title="Apagar transação"
        message="O saldo da conta será revertido. Esta ação é irreversível."
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
  dangerSection: { marginTop: 32, borderTopWidth: 1, paddingTop: 16 },
  dangerBtn: { paddingVertical: 16, alignItems: 'center' },
  dangerText: { fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
