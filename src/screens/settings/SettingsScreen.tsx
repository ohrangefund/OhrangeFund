import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRight, Palette } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsMain'>;

export function SettingsScreen({ navigation }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>GERAL</Text>
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        <Pressable
          onPress={() => navigation.navigate('Visuals')}
          style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
            <Palette size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowText, { color: colors.text }]}>Visuais</Text>
          <ChevronRight size={18} color={colors.textSecondary} />
        </Pressable>
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
  iconWrap: {
    width: 34, height: 34, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowText: { flex: 1, fontSize: 15, fontWeight: '500' },
});
