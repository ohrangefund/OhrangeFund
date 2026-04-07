import { useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, UserPlus, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { createSharedAccount } from '@/api/accounts';
import { inviteMember } from '@/api/accountMembers';
import { amountToCents } from '@/utils/currency';
import { ACCOUNT_COLORS, ACCOUNT_ICONS } from '@/types/models';
import { IconPickerModal, ALL_ICONS_MAP } from '@/components/ui/IconPickerModal';
import { ColorPickerModal } from '@/components/ui/ColorPickerModal';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddSharedAccountModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState<string>(ACCOUNT_COLORS[0]);
  const [icon, setIcon] = useState<string>(ACCOUNT_ICONS[0]);
  const [showInGeneral, setShowInGeneral] = useState(true);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [pendingMembers, setPendingMembers] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setName(''); setBalance('');
    setColor(ACCOUNT_COLORS[0]); setIcon(ACCOUNT_ICONS[0]);
    setShowInGeneral(true);
    setInviteEmail(''); setInviteError('');
    setPendingMembers([]);
    setError('');
  }

  function handleClose() { reset(); onClose(); }

  function handleAddMember() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    if (pendingMembers.includes(email)) {
      setInviteError(t('sharing.errorAlreadyMember'));
      return;
    }
    setInviteError('');
    setPendingMembers((prev) => [...prev, email]);
    setInviteEmail('');
  }

  function handleRemoveMember(email: string) {
    setPendingMembers((prev) => prev.filter((e) => e !== email));
  }

  async function handleSubmit() {
    if (!user) return;
    if (!name.trim()) { setError(t('common.enterName')); return; }
    const cents = balance.trim() ? amountToCents(parseFloat(balance.replace(',', '.'))) : 0;
    if (isNaN(cents)) { setError(t('modalAccount.invalidBalance')); return; }
    if (pendingMembers.length === 0) { setError(t('sharing.errorNoMembers')); return; }

    setError('');
    setLoading(true);
    try {
      const accountId = await createSharedAccount(user.uid, {
        name: name.trim(), balance: cents, color, icon, show_in_general: showInGeneral,
      });
      await Promise.all(pendingMembers.map((email) => inviteMember(accountId, email)));
      handleClose();
    } catch (e: any) {
      const code = e.message ?? 'UNKNOWN';
      if (code === 'USER_NOT_FOUND') setError(t('sharing.errorNotFound'));
      else if (code === 'SELF_INVITE') setError(t('sharing.errorSelfInvite'));
      else setError(t('modalAccount.errorCreate'));
    } finally {
      setLoading(false);
    }
  }

  const inlineIconSet = new Set(ACCOUNT_ICONS as readonly string[]);
  const displayIcons = inlineIconSet.has(icon) ? [...ACCOUNT_ICONS] : [icon, ...ACCOUNT_ICONS];
  const inlineColorSet = new Set(ACCOUNT_COLORS as readonly string[]);
  const displayColors = inlineColorSet.has(color) ? [...ACCOUNT_COLORS] : [color, ...ACCOUNT_COLORS];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('sharing.createTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.name')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={t('sharing.namePlaceholder')}
              placeholderTextColor={colors.textDisabled}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalAccount.initialBalance')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.textDisabled}
              value={balance}
              onChangeText={setBalance}
              keyboardType="decimal-pad"
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
                <Text style={{ color: colors.textSecondary, fontSize: 15, fontWeight: '700' }}>•••</Text>
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
                    style={[styles.iconSwatch, { backgroundColor: selected ? color + '33' : colors.surface, borderColor: selected ? color : colors.border }]}
                  >
                    <Icon size={22} color={selected ? color : colors.textSecondary} />
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setShowIconPicker(true)}
                style={[styles.iconSwatch, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '700' }}>•••</Text>
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalAccount.showInGeneral')}</Text>
            <View style={styles.typeRow}>
              {([true, false] as const).map((val) => (
                <Pressable
                  key={String(val)}
                  onPress={() => setShowInGeneral(val)}
                  style={[styles.typeBtn, { backgroundColor: showInGeneral === val ? colors.primary : colors.surface, borderColor: showInGeneral === val ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: showInGeneral === val ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
                    {val ? t('common.yes') : t('common.no')}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ── Members ── */}
            <View style={[styles.divider, { borderTopColor: colors.border }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('sharing.membersTitle')}</Text>
            <Text style={[styles.inviteHint, { color: colors.textSecondary }]}>{t('sharing.inviteHint')}</Text>

            <View style={styles.inviteRow}>
              <TextInput
                style={[styles.inviteInput, { backgroundColor: colors.surface, borderColor: inviteError ? colors.error : colors.border, color: colors.text, flex: 1 }]}
                placeholder="email@exemplo.com"
                placeholderTextColor={colors.textDisabled}
                value={inviteEmail}
                onChangeText={(v) => { setInviteEmail(v); setInviteError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                onSubmitEditing={handleAddMember}
                returnKeyType="done"
              />
              <Pressable
                onPress={handleAddMember}
                disabled={!inviteEmail.trim()}
                style={({ pressed }) => [
                  styles.addBtn,
                  { backgroundColor: colors.primary, opacity: pressed || !inviteEmail.trim() ? 0.5 : 1 },
                ]}
              >
                <UserPlus size={18} color="#fff" />
              </Pressable>
            </View>
            {inviteError ? <Text style={[styles.fieldError, { color: colors.error }]}>{inviteError}</Text> : null}

            {pendingMembers.map((email) => (
              <View key={email} style={[styles.memberRow, { backgroundColor: colors.surface }]}>
                <View style={[styles.memberIcon, { backgroundColor: colors.primary + '22' }]}>
                  <Text style={[styles.memberInitial, { color: colors.primary }]}>
                    {email[0].toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.memberEmail, { color: colors.text }]} numberOfLines={1}>{email}</Text>
                <Pressable onPress={() => handleRemoveMember(email)} hitSlop={8}>
                  <Trash2 size={16} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t('sharing.createBtn')}</Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <IconPickerModal visible={showIconPicker} selectedIcon={icon} selectedColor={color} onSelect={setIcon} onClose={() => setShowIconPicker(false)} />
      <ColorPickerModal visible={showColorPicker} selectedColor={color} onSelect={setColor} onClose={() => setShowColorPicker(false)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 8 },
  error: { fontSize: 13, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconSwatch: { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  divider: { borderTopWidth: 1, marginTop: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  inviteHint: { fontSize: 13, marginBottom: 12 },
  inviteRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  inviteInput: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 15 },
  addBtn: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fieldError: { fontSize: 12, marginTop: 4 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12, marginTop: 8 },
  memberIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 13, fontWeight: '700' },
  memberEmail: { flex: 1, fontSize: 14 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
