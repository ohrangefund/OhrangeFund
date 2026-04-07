import { useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { inviteMember } from '@/api/accountMembers';

interface Props {
  visible: boolean;
  accountId: string;
  accountName: string;
  onClose: () => void;
}

export function InviteMemberModal({ visible, accountId, accountName, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setEmail('');
    setError('');
  }

  function handleClose() {
    if (loading) return;
    reset();
    onClose();
  }

  async function handleInvite() {
    if (!email.trim()) return;
    setError('');
    setLoading(true);
    try {
      await inviteMember(accountId, email.trim().toLowerCase());
      reset();
      onClose();
    } catch (e: any) {
      const code = e.message ?? 'UNKNOWN';
      if (code === 'USER_NOT_FOUND') setError(t('sharing.errorNotFound'));
      else if (code === 'ALREADY_MEMBER') setError(t('sharing.errorAlreadyMember'));
      else if (code === 'SELF_INVITE') setError(t('sharing.errorSelfInvite'));
      else setError(t('sharing.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{t('sharing.inviteTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {accountName}
          </Text>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text },
            ]}
            placeholder={t('sharing.emailPlaceholder')}
            placeholderTextColor={colors.textDisabled}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          <Pressable
            onPress={handleInvite}
            disabled={loading || !email.trim()}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || loading || !email.trim() ? 0.5 : 1,
              },
            ]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{t('sharing.inviteBtn')}</Text>
            }
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: { width: '100%', borderRadius: 16, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13, marginBottom: 16 },
  input: {
    borderWidth: 1, borderRadius: 12,
    padding: 14, fontSize: 15, marginBottom: 16,
  },
  error: { fontSize: 13, marginBottom: 12, textAlign: 'center' },
  btn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
