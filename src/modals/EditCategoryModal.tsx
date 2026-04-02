import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SelectCategoryModal } from '@/components/ui/SelectCategoryModal';
import { IconPickerModal, ALL_ICONS_MAP } from '@/components/ui/IconPickerModal';
import { ColorPickerModal } from '@/components/ui/ColorPickerModal';
import { updateCategory, deleteCategory, hasTransactionsForCategory, deleteCategoryWithRedirect } from '@/api/categories';
import { CATEGORY_COLORS, CATEGORY_ICONS, type Category } from '@/types/models';

interface Props {
  category: Category | null;
  onClose: () => void;
}

export function EditCategoryModal({ category, onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { incomeCategories, expenseCategories } = useCategories();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRedirect, setShowRedirect] = useState(false);
  const [redirectCategoryId, setRedirectCategoryId] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const redirectCategories = (category?.type === 'expense' ? expenseCategories : incomeCategories)
    .filter((c) => c.id !== category?.id);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setIcon(category.icon);
      setError('');
      setShowConfirm(false);
      setShowRedirect(false);
      setRedirectCategoryId('');
    }
  }, [category]);

  async function handleSave() {
    if (!category) return;
    if (!name.trim()) { setError(t('common.enterName')); return; }
    setError('');
    setLoading(true);
    try {
      await updateCategory(category.id, { name: name.trim(), color, icon });
      onClose();
    } catch {
      setError(t('common.errorSave'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePress() {
    if (!category || !user) return;
    const hasTxns = await hasTransactionsForCategory(user.uid, category.id);
    if (hasTxns) {
      setShowRedirect(true);
    } else {
      setShowConfirm(true);
    }
  }

  async function handleConfirmDelete() {
    if (!category) return;
    setLoading(true);
    try {
      if (redirectCategoryId) {
        await deleteCategoryWithRedirect(user!.uid, category.id, redirectCategoryId);
      } else {
        await deleteCategory(category.id);
      }
      onClose();
    } catch {
      setError(t('common.errorDelete'));
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  const inlineIconSet = new Set(CATEGORY_ICONS as readonly string[]);
  const displayIcons: string[] = inlineIconSet.has(icon)
    ? [...CATEGORY_ICONS]
    : [icon, ...(CATEGORY_ICONS as readonly string[])];

  const inlineColorSet = new Set(CATEGORY_COLORS as readonly string[]);
  const displayColors: string[] = inlineColorSet.has(color)
    ? [...CATEGORY_COLORS]
    : [color, ...(CATEGORY_COLORS as readonly string[])];

  return (
    <Modal visible={!!category} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('modalCategory.editTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.name')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              maxLength={50}
              placeholderTextColor={colors.textDisabled}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.color')}</Text>
            <View style={styles.colorGrid}>
              {displayColors.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorSwatch, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.text }]}
                />
              ))}
              <Pressable
                onPress={() => setShowColorPicker(true)}
                style={[styles.colorSwatch, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '700', letterSpacing: 1 }}>•••</Text>
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.icon')}</Text>
            <View style={styles.iconGrid}>
              {displayIcons.map((ic) => {
                const Icon = ALL_ICONS_MAP[ic];
                if (!Icon) return null;
                const selected = icon === ic;
                return (
                  <Pressable
                    key={ic}
                    onPress={() => setIcon(ic)}
                    style={[
                      styles.iconSwatch,
                      { backgroundColor: selected ? color + '33' : colors.surface, borderColor: selected ? color : colors.border },
                    ]}
                  >
                    <Icon size={22} color={selected ? color : colors.textSecondary} />
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setShowIconPicker(true)}
                style={[styles.iconSwatch, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '700', letterSpacing: 1 }}>•••</Text>
              </Pressable>
            </View>

          </ScrollView>

          <View style={[styles.dangerSection, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={() => category?.is_default ? null : handleDeletePress()}
              style={styles.dangerBtn}
            >
              <Text style={[styles.dangerText, { color: category?.is_default ? colors.textDisabled : colors.error }]}>
                {t('modalCategory.deleteBtn')}
              </Text>
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

      <SelectCategoryModal
        visible={showRedirect}
        title={t('modalCategory.redirectTitle')}
        categories={redirectCategories}
        selectedId={redirectCategoryId}
        onSelect={(id) => { setRedirectCategoryId(id); setShowRedirect(false); setShowConfirm(true); }}
        onClose={() => setShowRedirect(false)}
      />
      <ConfirmModal
        visible={showConfirm}
        title={t('modalCategory.deleteTitle')}
        message={redirectCategoryId ? t('modalCategory.deleteMsgRedirect') : t('modalCategory.deleteMsg')}
        confirmLabel={t('common.delete')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
      <IconPickerModal
        visible={showIconPicker}
        selectedIcon={icon}
        selectedColor={color}
        onSelect={setIcon}
        onClose={() => setShowIconPicker(false)}
      />
      <ColorPickerModal
        visible={showColorPicker}
        selectedColor={color}
        onSelect={setColor}
        onClose={() => setShowColorPicker(false)}
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
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconSwatch: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  dangerSection: { marginTop: 32, borderTopWidth: 1 },
  dangerBtn: { paddingVertical: 16, alignItems: 'center' },
  dangerText: { fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
