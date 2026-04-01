import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage, type Language } from '@/context/LanguageContext';
import { useTranslation } from 'react-i18next';

const OPTIONS: { lang: Language; label: string; description: string }[] = [
  { lang: 'en', label: 'English', description: 'English' },
  { lang: 'pt', label: 'Português', description: 'Português' },
];

export function LanguageScreen() {
  const { colors } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('language.sectionLabel')}
      </Text>
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        {OPTIONS.map(({ lang, label, description }, i) => {
          const active = language === lang;
          return (
            <Pressable
              key={lang}
              onPress={() => setLanguage(lang)}
              style={({ pressed }) => [
                styles.row,
                i < OPTIONS.length - 1 && [styles.rowBorder, { borderBottomColor: colors.border }],
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.rowText}>
                <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
              </View>
              {active && <Check size={18} color={colors.primary} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  group: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  rowBorder: { borderBottomWidth: 1 },
  rowText: { flex: 1 },
  label: { fontSize: 15, fontWeight: '500' },
  description: { fontSize: 13, marginTop: 2 },
});
