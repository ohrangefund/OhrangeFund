import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeMode } from '@/constants/theme';

const OPTIONS: { mode: ThemeMode; label: string; description: string }[] = [
  { mode: 'light', label: 'Tema claro', description: 'Fundo branco, ícones escuros' },
  { mode: 'dark',  label: 'Tema escuro', description: 'Fundo escuro, ícones claros' },
];

export function VisualsScreen() {
  const { colors, theme, setTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>APARÊNCIA</Text>
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        {OPTIONS.map(({ mode, label, description }, i) => {
          const active = theme === mode;
          return (
            <Pressable
              key={mode}
              onPress={() => setTheme(mode)}
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
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16,
  },
  rowBorder: { borderBottomWidth: 1 },
  rowText: { flex: 1 },
  label: { fontSize: 15, fontWeight: '500' },
  description: { fontSize: 13, marginTop: 2 },
});
