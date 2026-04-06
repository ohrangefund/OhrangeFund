import { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { ChevronRight, Palette, LogOut, Trash2, Globe } from 'lucide-react-native';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useInvestmentAccount } from '@/hooks/useInvestmentAccount';
import { useInvestmentAssets } from '@/hooks/useInvestmentAssets';
import { getAssetPrices } from '@/api/investmentPrices';
import { auth } from '@/api/firebase';
import { deleteUserAccount } from '@/api/user';
import { formatCurrency } from '@/utils/currency';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsMain'>;

export function SettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();

  const { accounts } = useAccounts();
  const { account: investAccount } = useInvestmentAccount();
  const { assets } = useInvestmentAssets(investAccount?.id ?? null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [pricesLoaded, setPricesLoaded] = useState(false);

  useEffect(() => {
    if (assets.length === 0) { setPricesLoaded(true); return; }
    getAssetPrices(assets.map((a) => a.ticker))
      .then((p) => setPrices(p))
      .catch(() => {})
      .finally(() => setPricesLoaded(true));
  }, [assets]);

  const netWorth = useMemo(() => {
    const accountsTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
    const portfolioTotal = assets.reduce((sum, a) => sum + Math.round(a.quantity * (prices[a.ticker] ?? 0)), 0);
    return accountsTotal + portfolioTotal;
  }, [accounts, assets, prices]);

  const displayName = user?.displayName ?? user?.email ?? '?';
  const avatarLetter = displayName[0].toUpperCase();

  function getReauthError(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return t('settings.reauthErrors.invalidCredential');
      case 'auth/too-many-requests':
        return t('settings.reauthErrors.tooManyRequests');
      default:
        return t('settings.reauthErrors.default');
    }
  }
  const [showDelete, setShowDelete] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const submitting = useRef(false);

  function openDeleteModal() {
    setDeleteEmail('');
    setDeletePassword('');
    setDeleteError('');
    setShowDelete(true);
  }

  function closeDeleteModal() {
    if (deleting) return;
    setShowDelete(false);
  }

  async function handleDeleteAccount() {
    if (!user || submitting.current) return;
    submitting.current = true;
    setDeleteError('');
    setDeleting(true);
    try {
      const credential = EmailAuthProvider.credential(deleteEmail.trim(), deletePassword);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await deleteUserAccount(user.uid);
      // onAuthStateChanged dispara automaticamente → navega para AuthStack
    } catch (e: any) {
      setDeleteError(getReauthError(e.code));
      setDeleting(false);
      submitting.current = false;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('settings.profile')}</Text>
      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarLetter}>{avatarLetter}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.netWorthRow}>
            <Text style={[styles.netWorthLabel, { color: colors.textSecondary }]}>
              {t('settings.netWorth')}
            </Text>
            {pricesLoaded
              ? <Text style={[styles.netWorthValue, { color: colors.primary }]}>
                  {formatCurrency(netWorth)}
                </Text>
              : <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />
            }
          </View>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>{t('settings.general')}</Text>
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        <Pressable
          onPress={() => navigation.navigate('Visuals')}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
            <Palette size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowText, { color: colors.text }]}>{t('settings.visuals')}</Text>
          <ChevronRight size={18} color={colors.textSecondary} />
        </Pressable>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <Pressable
          onPress={() => navigation.navigate('Language')}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
            <Globe size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowText, { color: colors.text }]}>{t('settings.language')}</Text>
          <ChevronRight size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>{t('settings.account')}</Text>

      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        <Pressable
          onPress={signOut}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.error + '22' }]}>
            <LogOut size={18} color={colors.error} />
          </View>
          <Text style={[styles.rowText, { color: colors.error }]}>{t('settings.signOut')}</Text>
        </Pressable>
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <Pressable
          onPress={openDeleteModal}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.error + '22' }]}>
            <Trash2 size={18} color={colors.error} />
          </View>
          <Text style={[styles.rowText, { color: colors.error }]}>{t('settings.deleteAccount')}</Text>
        </Pressable>
      </View>

      <Modal visible={showDelete} transparent animationType="fade" onRequestClose={closeDeleteModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.overlay}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDeleteModal} />
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.deleteAccountTitle')}</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {t('settings.deleteAccountMessage')}
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary, marginTop: 4 }]}>
              {t('settings.confirmIdentity')}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={deleteEmail}
              onChangeText={setDeleteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!deleting}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              editable={!deleting}
            />

            {deleteError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{deleteError}</Text>
            ) : null}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.actions}>
              <Pressable
                onPress={closeDeleteModal}
                disabled={deleting}
                style={({ pressed }) => [styles.btn, { opacity: pressed || deleting ? 0.5 : 1 }]}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
              </Pressable>
              <View style={[styles.actionSep, { backgroundColor: colors.border }]} />
              <Pressable
                onPress={handleDeleteAccount}
                disabled={deleting || !deleteEmail || !deletePassword}
                style={({ pressed }) => [styles.btn, { opacity: pressed || deleting || !deleteEmail || !deletePassword ? 0.5 : 1 }]}
              >
                {deleting
                  ? <ActivityIndicator size="small" color={colors.error} />
                  : <Text style={[styles.confirmText, { color: colors.error }]}>{t('settings.deleteAll')}</Text>}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 16, marginBottom: 8,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLetter: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  netWorthRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  netWorthLabel: { fontSize: 13 },
  netWorthValue: { fontSize: 15, fontWeight: '700' },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  group: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconWrap: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: '500' },
  separator: { height: 1, marginLeft: 62 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  card: { width: '100%', borderRadius: 16, overflow: 'hidden', padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  modalMessage: { fontSize: 14, textAlign: 'center', lineHeight: 20, color: '#999' },
  input: {
    borderWidth: 1, borderRadius: 12,
    padding: 14, fontSize: 15,
    marginTop: 12,
  },
  errorText: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  divider: { height: 1, marginTop: 20 },
  actions: { flexDirection: 'row' },
  btn: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 15 },
  confirmText: { fontSize: 15, fontWeight: '600' },
  actionSep: { width: 1 },
});
