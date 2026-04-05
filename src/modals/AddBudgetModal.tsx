import { useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { createBudget } from '@/api/budgets';
import { ALL_ICONS_MAP } from '@/components/ui/IconPickerModal';
import { amountToCents } from '@/utils/currency';
import type { Category } from '@/types/models';

interface Props {
  visible: boolean;
  expenseCategories: Category[];
  budgetedCategoryIds: Set<string>;
  onClose: () => void;
}

export function AddBudgetModal({ visible, expenseCategories, budgetedCategoryIds, onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [selected, setSelected] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const available = expenseCategories.filter((c) => !budgetedCategoryIds.has(c.id));

  function handleClose() {
    setSelected(null); setAmount(''); setError('');
    onClose();
  }

  async function handleSave() {
    if (!selected || !user) return;
    const cents = amountToCents(amount);
    if (!cents || cents <= 0) { setError(t('common.invalidAmount')); return; }
    setLoading(true); setError('');
    try {
      await createBudget(user.uid, { category_id: selected.id, amount_limit: cents });
      handleClose();
    } catch {
      setError(t('common.errorSave'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>

          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('budgets.addTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {available.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('budgets.allCategoriesBudgeted')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('budgets.selectCategory')}
              </Text>
              <FlatList
                data={available}
                keyExtractor={(item) => item.id}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isSelected = selected?.id === item.id;
                  const IconComponent = ALL_ICONS_MAP[item.icon as keyof typeof ALL_ICONS_MAP];
                  return (
                    <Pressable
                      onPress={() => setSelected(isSelected ? null : item)}
                      style={({ pressed }) => [
                        styles.catRow,
                        {
                          backgroundColor: isSelected ? colors.primary + '18' : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
                        {IconComponent
                          ? <IconComponent size={18} color={item.color} />
                          : <View style={[styles.iconFallback, { backgroundColor: item.color }]} />
                        }
                      </View>
                      <Text style={[styles.catName, { color: colors.text }]}>{item.name}</Text>
                    </Pressable>
                  );
                }}
              />

              {selected && (
                <View style={[styles.amountSection, { borderTopColor: colors.border }]}>
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
                      : <Text style={styles.saveBtnText}>{t('budgets.createBtn')}</Text>
                    }
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
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
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginHorizontal: 16, marginTop: 14, marginBottom: 8 },
  list: { flex: 1 },
  catRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 8,
    borderWidth: 1.5,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  iconFallback: { width: 18, height: 18, borderRadius: 4 },
  catName: { fontSize: 15, fontWeight: '500' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  amountSection: { padding: 20, borderTopWidth: 1 },
  error: { fontSize: 13, marginBottom: 8 },
  input: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, marginBottom: 12,
  },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
