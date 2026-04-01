import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { auth } from '@/api/firebase';
import { useTheme } from '@/context/ThemeContext';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import type { AuthScreenProps } from '@/types/navigation';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return t('auth.errors.invalidCredential');
      case 'auth/invalid-email':
        return t('auth.errors.invalidEmail');
      case 'auth/too-many-requests':
        return t('auth.errors.tooManyRequests');
      default:
        return t('auth.errors.signIn', { code });
    }
  }

  async function handleLogin() {
    if (!email || !password) { setError(t('auth.fillAllFields')); return; }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      setError(getErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('auth.signIn')}</Text>

      <LanguagePicker style={styles.langPicker} />

      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder={t('auth.email')}
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder={t('auth.password')}
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.primaryForeground} />
          : <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{t('auth.signInBtn')}</Text>
        }
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={[styles.link, { color: colors.textSecondary }]}>
          {t('auth.noAccount')}<Text style={{ color: colors.primary, fontWeight: '600' }}>{t('auth.signUp')}</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  langPicker: { marginBottom: 20 },
  error: { marginBottom: 12, fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12, fontSize: 16 },
  primaryButton: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16, marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', fontSize: 14 },
});
