import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import { AuthBackground } from '@/components/ui/AuthBackground';
import type { AuthScreenProps } from '@/types/navigation';

export function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoSlide   = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide   = useRef(new Animated.Value(72)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoSlide, {
          toValue: 0,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(cardSlide, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero */}
      <View style={styles.hero}>
        <AuthBackground color={colors.primary} />

        <Animated.View
          style={[
            styles.logoArea,
            { opacity: logoOpacity, transform: [{ translateY: logoSlide }] },
          ]}
        >
          <View style={[styles.accentLine, { backgroundColor: colors.primary }]} />

          <Text style={[styles.logoLine1, { color: colors.text }]}>
            OHRANGE
          </Text>
          <Text style={[styles.logoLine2, { color: colors.primary }]}>
            FUND
          </Text>

          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            {t('auth.appSubtitle').toUpperCase()}
          </Text>
        </Animated.View>
      </View>

      {/* Action card */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            opacity: cardOpacity,
            transform: [{ translateY: cardSlide }],
          },
        ]}
      >
        <LanguagePicker style={styles.langPicker} />

        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
            {t('auth.signInBtn')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Register')}
          style={({ pressed }) => [
            styles.outlineBtn,
            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.outlineBtnText, { color: colors.text }]}>
            {t('auth.registerBtn')}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* ── Hero ── */
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 44,
  },
  logoArea: {
    paddingHorizontal: 36,
  },
  accentLine: {
    width: 48,
    height: 4,
    borderRadius: 2,
    marginBottom: 22,
  },
  logoLine1: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 4,
    lineHeight: 58,
  },
  logoLine2: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 4,
    lineHeight: 58,
    marginBottom: 22,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 2.5,
    fontWeight: '600',
  },

  /* ── Card ── */
  card: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 52,
  },
  langPicker: { marginBottom: 28 },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
