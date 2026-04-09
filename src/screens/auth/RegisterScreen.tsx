import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Animated, Easing, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { auth, db } from '@/api/firebase';
import { createDefaultCategories } from '@/api/categories';
import { createInvestmentAccount } from '@/api/investmentAccounts';
import { createAccount } from '@/api/accounts';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { AuthBackground } from '@/components/ui/AuthBackground';
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
  const [focused, setFocused] = useState<string | null>(null);
  const submitting = useRef(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide   = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  function getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return t('auth.errors.emailInUse');
      case 'auth/invalid-email':        return t('auth.errors.invalidEmail');
      case 'auth/weak-password':        return t('auth.errors.weakPassword');
      default:                          return t('auth.errors.createAccount');
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
      await createAccount(user.uid, {
        name: language === 'pt' ? 'Conta Principal' : 'Main Account',
        balance: 0,
        color: '#F97316',
        icon: 'wallet',
      });
    } catch (e: any) {
      setError(getErrorMessage(e.code));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AuthBackground compact color={colors.primary} />

        {/* Back */}
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.55 : 1 }]}
        >
          <ChevronLeft size={26} color={colors.text} strokeWidth={2.5} />
        </Pressable>

        <Animated.View
          style={{ flex: 1, opacity: contentOpacity, transform: [{ translateY: contentSlide }] }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>{t('auth.register')}</Text>
            <View style={[styles.titleBar, { backgroundColor: colors.primary }]} />

            {/* Error */}
            {error ? (
              <View style={[
                styles.errorBox,
                { backgroundColor: colors.error + '15', borderColor: colors.error + '35' },
              ]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            {/* Inputs */}
            <View style={styles.fieldGroup}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderBottomColor: focused === 'email' ? colors.primary : colors.border,
                    borderBottomWidth: focused === 'email' ? 2 : 1.5,
                  },
                ]}
                placeholder={t('auth.email')}
                placeholderTextColor={colors.textDisabled}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderBottomColor: focused === 'password' ? colors.primary : colors.border,
                    borderBottomWidth: focused === 'password' ? 2 : 1.5,
                  },
                ]}
                placeholder={t('auth.passwordMin')}
                placeholderTextColor={colors.textDisabled}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
              />
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleRegister}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.primary, opacity: loading || pressed ? 0.78 : 1 },
              ]}
            >
              {loading
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                    {t('auth.registerBtn')}
                  </Text>
              }
            </Pressable>

            {/* Switch */}
            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={({ pressed }) => [styles.switchRow, { opacity: pressed ? 0.65 : 1 }]}
            >
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                {t('auth.haveAccount')}
              </Text>
              <Text style={[styles.switchLink, { color: colors.primary }]}>
                {t('auth.signInLink')}
              </Text>
            </Pressable>

            <LanguagePicker style={styles.langPicker} />
          </ScrollView>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: 22,
    zIndex: 10,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 32,
    paddingTop: 130,
    paddingBottom: 48,
  },
  title: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 14,
  },
  titleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    marginBottom: 40,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  errorText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  fieldGroup: { marginBottom: 8 },
  input: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 2,
    fontSize: 16,
    marginBottom: 20,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '700' },
  langPicker: { marginTop: 32 },
});
