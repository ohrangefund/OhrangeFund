import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { updateBudget, deleteBudget } from '@/api/budgets';
import { ALL_ICONS_MAP } from '@/components/ui/IconPickerModal';
import { amountToCents, formatCurrency } from '@/utils/currency';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { Budget, Category } from '@/types/models';

interface Props {
  budget: Budget | null;
  category: Category | undefined;
  onClose: () => void;
}

export function EditBudgetModal({ budget, category, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (budget) {
      setAmount((budget.amount_limit / 100).toFixed(2).replace('.', ','));
      setError('');
    }
  }, [budget]);

  async function handleSave() {
    if (!budget) return;
    const cents = amountToCents(amount);
    if (!cents || cents <= 0) { setError(t('common.invalidAmount')); return; }
    setLoading(true); setError('');
    try {
      await updateBudget(budget.id, cents);
      onClose();
    } catch {
      setError(t('common.errorSave'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!budget) return;
    try {
      await deleteBudget(budget.id);
      onClose();
    } catch {
      setError(t('common.errorDelete'));
    }
  }

  const IconComponent = category
    ? ALL_ICONS_MAP[category.icon as keyof typeof ALL_ICONS_MAP]
    : null;

  return (
    <>
      <Modal
        visible={!!budget}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>

            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>{t('budgets.editTitle')}</Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={22} color={colors.textSecondary} />
              </Pressable>
            </View>

            {category && (
              <View style={[styles.categoryRow, { backgroundColor: colors.surface }]}>
                <View style={[styles.iconWrap, { backgroundColor: category.color + '22' }]}>
                  {IconComponent
                    ? <IconComponent size={20} color={category.color} />
                    : <View style={[styles.iconFallback, { backgroundColor: category.color }]} />
                  }
                </View>
                <Text style={[styles.catName, { color: colors.text }]}>{category.name}</Text>
              </View>
            )}

            <View style={styles.form}>
              {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder={t('budgets.monthlyLimit')}
                placeholderTextColor={colors.textDisabled}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              <Pressable
                onPress={handleSave}
                disabled={loading}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.primary, opacity: (loading || pressed) ? 0.7 : 1 },
                ]}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                }
              </Pressable>

              <Pressable
                onPress={() => setShowConfirmDelete(true)}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  { borderColor: colors.error, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[styles.deleteBtnText, { color: colors.error }]}>
                  {t('budgets.deleteBtn')}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={showConfirmDelete}
        title={t('budgets.deleteTitle')}
        message={t('budgets.deleteMsg')}
        confirmLabel={t('common.delete')}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 14, padding: 14,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconFallback: { width: 20, height: 20, borderRadius: 4 },
  catName: { fontSize: 16, fontWeight: '600' },
  form: { padding: 20 },
  error: { fontSize: 13, marginBottom: 8 },
  input: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, marginBottom: 12,
  },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1.5 },
  deleteBtnText: { fontSize: 16, fontWeight: '600' },
});
