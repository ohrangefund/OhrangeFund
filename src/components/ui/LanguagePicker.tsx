import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export function LanguagePicker({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <View style={[styles.row, style]}>
      {(['en', 'pt'] as const).map((lang) => (
        <Pressable
          key={lang}
          onPress={() => setLanguage(lang)}
          style={[
            styles.btn,
            { borderColor: language === lang ? colors.primary : colors.border,
              backgroundColor: language === lang ? colors.primary : colors.surface },
          ]}
        >
          <Text style={{ color: language === lang ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
            {lang === 'en' ? 'English' : 'Português'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
});
