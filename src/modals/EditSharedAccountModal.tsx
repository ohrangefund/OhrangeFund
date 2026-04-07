import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, UserPlus, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAccountMembers } from '@/hooks/useAccountMembers';
import { updateAccount, archiveAccount } from '@/api/accounts';
import { inviteMember, removeMember } from '@/api/accountMembers';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { IconPickerModal, ALL_ICONS_MAP } from '@/components/ui/IconPickerModal';
import { ColorPickerModal } from '@/components/ui/ColorPickerModal';
import { ACCOUNT_COLORS, ACCOUNT_ICONS, type Account, type AccountMember } from '@/types/models';

interface Props {
  account: Account | null;
  onClose: () => void;
}

export function EditSharedAccountModal({ account, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { members, loading: membersLoading } = useAccountMembers(account?.id ?? null);

  const isOwner = !!account && !!user && account.user_id === user.uid;

  // Edit state (owner only)
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(ACCOUNT_COLORS[0]);
  const [icon, setIcon] = useState<string>(ACCOUNT_ICONS[0]);
  const [showInGeneral, setShowInGeneral] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Remove member state
  const [removingMember, setRemovingMember] = useState<AccountMember | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setColor(account.color);
      setIcon(account.icon);
      setShowInGeneral(account.show_in_general !== false);
      setSaveError('');
      setInviteEmail('');
      setInviteError('');
      setShowInviteForm(false);
    }
  }, [account]);

  async function handleSave() {
    if (!account) return;
    if (!name.trim()) { setSaveError(t('common.enterName')); return; }
    setSaveError('');
    setSaveLoading(true);
    try {
      await updateAccount(account.id, { name: name.trim(), color, icon, show_in_general: showInGeneral });
      onClose();
    } catch {
      setSaveError(t('common.errorSave'));
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleArchiveConfirm() {
    if (!account) return;
    setSaveLoading(true);
    try {
      await archiveAccount(account.id, !account.archived);
      onClose();
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !account) return;
    setInviteError('');
    setInviting(true);
    try {
      await inviteMember(account.id, inviteEmail.trim().toLowerCase());
      setInviteEmail('');
      setShowInviteForm(false);
    } catch (e: any) {
      const code = e.message ?? 'UNKNOWN';
      if (code === 'USER_NOT_FOUND') setInviteError(t('sharing.errorNotFound'));
      else if (code === 'ALREADY_MEMBER') setInviteError(t('sharing.errorAlreadyMember'));
      else if (code === 'SELF_INVITE') setInviteError(t('sharing.errorSelfInvite'));
      else setInviteError(t('sharing.errorGeneric'));
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember() {
    if (!removingMember) return;
    await removeMember(removingMember.id);
    setRemovingMember(null);
  }

  const inlineIconSet = new Set(ACCOUNT_ICONS as readonly string[]);
  const displayIcons = inlineIconSet.has(icon) ? [...ACCOUNT_ICONS] : [icon, ...ACCOUNT_ICONS];
  const inlineColorSet = new Set(ACCOUNT_COLORS as readonly string[]);
  const displayColors = inlineColorSet.has(color) ? [...ACCOUNT_COLORS] : [color, ...ACCOUNT_COLORS];

  return (
    <Modal visible={!!account} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isOwner ? t('sharing.editTitle') : account?.name ?? ''}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

            {/* ── Owner edit form ── */}
            {isOwner && (
              <>
                {saveError ? <Text style={[styles.error, { color: colors.error }]}>{saveError}</Text> : null}

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
                    <Pressable key={c} onPress={() => setColor(c)}
                      style={[styles.colorSwatch, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.text }]} />
                  ))}
                  <Pressable onPress={() => setShowColorPicker(true)}
                    style={[styles.colorSwatch, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
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
                      <Pressable key={ic} onPress={() => setIcon(ic)}
                        style={[styles.iconSwatch, { backgroundColor: selected ? color + '33' : colors.surface, borderColor: selected ? color : colors.border }]}>
                        <Icon size={22} color={selected ? color : colors.textSecondary} />
                      </Pressable>
                    );
                  })}
                  <Pressable onPress={() => setShowIconPicker(true)}
                    style={[styles.iconSwatch, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={{ color: colors.textSecondary, fontSize: 18, fontWeight: '700' }}>•••</Text>
                  </Pressable>
                </View>

                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('modalAccount.showInGeneral')}</Text>
                <View style={styles.typeRow}>
                  {([true, false] as const).map((val) => (
                    <Pressable key={String(val)} onPress={() => setShowInGeneral(val)}
                      style={[styles.typeBtn, { backgroundColor: showInGeneral === val ? colors.primary : colors.surface, borderColor: showInGeneral === val ? colors.primary : colors.border }]}>
                      <Text style={{ color: showInGeneral === val ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 14 }}>
                        {val ? t('common.yes') : t('common.no')}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* ── Members section ── */}
            {isOwner && (
              <>
                <View style={styles.membersHeader}>
                  <Text style={[styles.membersTitle, { color: colors.textSecondary }]}>
                    {t('sharing.membersTitle').toUpperCase()}
                  </Text>
                  <Pressable
                    onPress={() => setShowInviteForm((v) => !v)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <UserPlus size={18} color={colors.primary} />
                  </Pressable>
                </View>

                {/* Inline invite form */}
                {showInviteForm && (
                  <View style={[styles.inviteForm, { backgroundColor: colors.surface }]}>
                    <TextInput
                      style={[styles.inviteInput, { borderColor: colors.border, color: colors.text }]}
                      placeholder={t('sharing.emailPlaceholder')}
                      placeholderTextColor={colors.textDisabled}
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!inviting}
                    />
                    {inviteError ? <Text style={[{ color: colors.error, fontSize: 12, marginTop: 4 }]}>{inviteError}</Text> : null}
                    <Pressable
                      onPress={handleInvite}
                      disabled={inviting || !inviteEmail.trim()}
                      style={({ pressed }) => [
                        styles.inviteSubmit,
                        { backgroundColor: colors.primary, opacity: pressed || inviting || !inviteEmail.trim() ? 0.5 : 1 },
                      ]}
                    >
                      {inviting
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={styles.inviteSubmitText}>{t('sharing.inviteBtn')}</Text>
                      }
                    </Pressable>
                  </View>
                )}

                {membersLoading
                  ? <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
                  : members.length === 0
                    ? <Text style={[styles.noMembers, { color: colors.textDisabled }]}>{t('sharing.noMembers')}</Text>
                    : members.map((m) => {
                        const isPending = m.status === 'pending';
                        return (
                          <View key={m.id} style={[styles.memberRow, { backgroundColor: colors.surface }]}>
                            <View style={[styles.memberIcon, { backgroundColor: colors.primary + '22' }]}>
                              <Text style={[styles.memberInitial, { color: colors.primary }]}>
                                {(m.invitee_email[0] ?? '?').toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.memberEmail, { color: colors.text }]} numberOfLines={1}>
                                {m.invitee_email}
                              </Text>
                              {isPending && (
                                <Text style={[styles.pendingLabel, { color: colors.textSecondary }]}>
                                  {t('sharing.invitePending')}
                                </Text>
                              )}
                            </View>
                            <Pressable onPress={() => setRemovingMember(m)} hitSlop={8}>
                              <Trash2 size={16} color={colors.error} />
                            </Pressable>
                          </View>
                        );
                      })
                }
              </>
            )}

            {/* Archive button for owner */}
            {isOwner && (
              <View style={[styles.dangerZone, { borderTopColor: colors.border }]}>
                <Pressable onPress={() => setShowArchiveConfirm(true)} style={styles.dangerBtn}>
                  <Text style={[styles.dangerText, { color: account?.archived ? colors.success : colors.error }]}>
                    {account?.archived ? t('modalAccount.unarchive') : t('modalAccount.archive')}
                  </Text>
                </Pressable>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          {isOwner && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Pressable
                onPress={handleSave}
                disabled={saveLoading}
                style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
              >
                {saveLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitText}>{t('common.save')}</Text>
                }
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <IconPickerModal visible={showIconPicker} selectedIcon={icon} selectedColor={color} onSelect={setIcon} onClose={() => setShowIconPicker(false)} />
      <ColorPickerModal visible={showColorPicker} selectedColor={color} onSelect={setColor} onClose={() => setShowColorPicker(false)} />

      <ConfirmModal
        visible={showArchiveConfirm}
        title={account?.archived ? t('modalAccount.unarchive') : t('modalAccount.archive')}
        message={account?.archived ? t('modalAccount.unarchiveMsg') : t('modalAccount.archiveMsg')}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setShowArchiveConfirm(false)}
      />
      <ConfirmModal
        visible={!!removingMember}
        title={t('sharing.removeTitle')}
        message={t('sharing.removeMsg')}
        onConfirm={handleRemoveMember}
        onCancel={() => setRemovingMember(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 16 },
  error: { fontSize: 13, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconSwatch: { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  membersHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  membersTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  inviteForm: { borderRadius: 14, padding: 14, gap: 10, marginBottom: 12 },
  inviteInput: { borderWidth: 1, borderRadius: 10, padding: 11, fontSize: 14 },
  inviteSubmit: { borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  inviteSubmitText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  noMembers: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12, marginBottom: 6 },
  memberIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 14, fontWeight: '700' },
  memberEmail: { fontSize: 14 },
  pendingLabel: { fontSize: 11, marginTop: 1 },
  dangerZone: { marginTop: 24, borderTopWidth: 1 },
  dangerBtn: { paddingVertical: 16, alignItems: 'center' },
  dangerText: { fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
