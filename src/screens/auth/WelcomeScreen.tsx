import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { LanguagePicker } from '@/components/ui/LanguagePicker';
import type { AuthScreenProps } from '@/types/navigation';

export function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>OhrangeFund</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('auth.appSubtitle')}</Text>

      <LanguagePicker style={styles.langPicker} />

      <Pressable
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{t('auth.signInBtn')}</Text>
      </Pressable>

      <Pressable
        style={[styles.secondaryButton, { borderColor: colors.primary }]}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{t('auth.registerBtn')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  langPicker: { marginBottom: 32 },
  primaryButton: {
    borderRadius: 14, paddingVertical: 16,
    width: '100%', alignItems: 'center', marginBottom: 12,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    borderWidth: 1, borderRadius: 14, paddingVertical: 16,
    width: '100%', alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
});
