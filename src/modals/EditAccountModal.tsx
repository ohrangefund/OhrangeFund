import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { updateAccount, archiveAccount } from '@/api/accounts';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { IconPickerModal, ALL_ICONS_MAP } from '@/components/ui/IconPickerModal';
import { ColorPickerModal } from '@/components/ui/ColorPickerModal';
import { ACCOUNT_COLORS, ACCOUNT_ICONS, type Account } from '@/types/models';

interface Props {
  account: Account | null;
  onClose: () => void;
}

export function EditAccountModal({ account, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(ACCOUNT_COLORS[0]);
  const [icon, setIcon] = useState<string>(ACCOUNT_ICONS[0]);
  const [showInGeneral, setShowInGeneral] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setColor(account.color);
      setIcon(account.icon);
      setShowInGeneral(account.show_in_general !== false);
      setError('');
    }
  }, [account]);

  async function handleSave() {
    if (!account) return;
    if (!name.trim()) { setError(t('common.enterName')); return; }
    setError('');
    setLoading(true);
    try {
      await updateAccount(account.id, { name: name.trim(), color, icon, show_in_general: showInGeneral });
      onClose();
    } catch {
      setError(t('common.errorSave'));
    } finally {
      setLoading(false);
    }
  }

  async function handleArchiveConfirm() {
    if (!account) return;
    setLoading(true);
    try {
      await archiveAccount(account.id, !account.archived);
      onClose();
    } catch {
      setError(t('common.errorSave'));
    } finally {
      setLoading(false);
    }
  }

  const inlineIconSet = new Set(ACCOUNT_ICONS as readonly string[]);
  const displayIcons: string[] = inlineIconSet.has(icon)
    ? [...ACCOUNT_ICONS]
    : [icon, ...(ACCOUNT_ICONS as readonly string[])];

  const inlineColorSet = new Set(ACCOUNT_COLORS as readonly string[]);
  const displayColors: string[] = inlineColorSet.has(color)
    ? [...ACCOUNT_COLORS]
    : [color, ...(ACCOUNT_COLORS as readonly string[])];

  return (
    <Modal visible={!!account} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('modalAccount.editTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalAccount.showInGeneral')}</Text>
            <View style={styles.typeRow}>
              {([true, false] as const).map((val) => (
                <Pressable
                  key={String(val)}
                  onPress={() => setShowInGeneral(val)}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: showInGeneral === val ? colors.primary : colors.surface,
                      borderColor: showInGeneral === val ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: showInGeneral === val ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
                    {val ? t('common.yes') : t('common.no')}
                  </Text>
                </Pressable>
              ))}
            </View>

          </ScrollView>

          <View style={[styles.dangerSection, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => setShowArchiveConfirm(true)} style={styles.dangerBtn}>
              <Text style={[styles.dangerText, { color: account?.archived ? colors.success : colors.error }]}>
                {account?.archived ? t('modalAccount.unarchive') : t('modalAccount.archive')}
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

      <ConfirmModal
        visible={showArchiveConfirm}
        title={account?.archived ? t('modalAccount.unarchive') : t('modalAccount.archive')}
        message={account?.archived ? t('modalAccount.unarchiveMsg') : t('modalAccount.archiveMsg')}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setShowArchiveConfirm(false)}
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
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  typeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  dangerSection: { marginTop: 32, borderTopWidth: 1 },
  dangerBtn: { paddingVertical: 16, alignItems: 'center' },
  dangerText: { fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
