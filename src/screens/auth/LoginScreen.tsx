import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Animated, Easing, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { auth } from '@/api/firebase';
import { useTheme } from '@/context/ThemeContext';
import { AuthBackground } from '@/components/ui/AuthBackground';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import type { AuthScreenProps } from '@/types/navigation';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

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
            <Text style={[styles.title, { color: colors.text }]}>{t('auth.signIn')}</Text>
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
                placeholder={t('auth.password')}
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
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.primary, opacity: loading || pressed ? 0.78 : 1 },
              ]}
            >
              {loading
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                    {t('auth.signInBtn')}
                  </Text>
              }
            </Pressable>

            {/* Switch */}
            <Pressable
              onPress={() => navigation.navigate('Register')}
              style={({ pressed }) => [styles.switchRow, { opacity: pressed ? 0.65 : 1 }]}
            >
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                {t('auth.noAccount')}
              </Text>
              <Text style={[styles.switchLink, { color: colors.primary }]}>
                {t('auth.signUp')}
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
