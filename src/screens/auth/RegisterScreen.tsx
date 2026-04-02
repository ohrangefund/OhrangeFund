import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/api/firebase';
import { createDefaultCategories } from '@/api/categories';
import { createInvestmentAccount } from '@/api/investmentAccounts';
import { useTheme } from '@/context/ThemeContext';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import type { AuthScreenProps } from '@/types/navigation';

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  function getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return t('auth.errors.emailInUse');
      case 'auth/invalid-email': return t('auth.errors.invalidEmail');
      case 'auth/weak-password': return t('auth.errors.weakPassword');
      default: return t('auth.errors.createAccount');
    }
  }

  async function handleRegister() {
    if (!email || !password) { setError(t('auth.fillAllFields')); return; }
    if (submitting.current) return;
    submitting.current = true;
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        display_name: '',
        theme: 'dark',
        created_at: serverTimestamp(),
      });
      await createDefaultCategories(user.uid, language);
      await createInvestmentAccount(user.uid);
    } catch (e: any) {
      setError(getErrorMessage(e.code));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('auth.register')}</Text>

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
        placeholder={t('auth.passwordMin')}
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Pressable
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.primaryForeground} />
          : <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{t('auth.registerBtn')}</Text>
        }
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={[styles.link, { color: colors.textSecondary }]}>
          {t('auth.haveAccount')}<Text style={{ color: colors.primary, fontWeight: '600' }}>{t('auth.signInLink')}</Text>
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
