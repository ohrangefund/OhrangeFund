import {
  Modal, View, Text, ScrollView,
  Pressable, StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

const COLOR_ROWS = [
  ['#FEE2E2', '#FCA5A5', '#F87171', '#EF4444', '#DC2626', '#B91C1C', '#7F1D1D'], // Red
  ['#FFEDD5', '#FED7AA', '#FB923C', '#F97316', '#EA580C', '#C2410C', '#7C2D12'], // Orange
  ['#FEF9C3', '#FDE68A', '#FCD34D', '#F59E0B', '#EAB308', '#D97706', '#78350F'], // Amber
  ['#FEFCE8', '#FEF08A', '#FACC15', '#EAB308', '#CA8A04', '#A16207', '#713F12'], // Yellow
  ['#F7FEE7', '#D9F99D', '#A3E635', '#84CC16', '#65A30D', '#4D7C0F', '#1A2E05'], // Lime
  ['#DCFCE7', '#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D', '#14532D'], // Green
  ['#CCFBF1', '#99F6E4', '#2DD4BF', '#14B8A6', '#0D9488', '#0F766E', '#134E4A'], // Teal
  ['#CFFAFE', '#A5F3FC', '#22D3EE', '#06B6D4', '#0891B2', '#0E7490', '#164E63'], // Cyan
  ['#DBEAFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E3A8A'], // Blue
  ['#E0E7FF', '#C7D2FE', '#818CF8', '#6366F1', '#4F46E5', '#4338CA', '#312E81'], // Indigo
  ['#F3E8FF', '#D8B4FE', '#C084FC', '#A855F7', '#9333EA', '#7C3AED', '#4C1D95'], // Purple
  ['#FDF4FF', '#F0ABFC', '#E879F9', '#D946EF', '#C026D3', '#A21CAF', '#701A75'], // Fuchsia
  ['#FCE7F3', '#F9A8D4', '#F472B6', '#EC4899', '#DB2777', '#BE185D', '#831843'], // Pink
  ['#FFF1F2', '#FECDD3', '#FDA4AF', '#F43F5E', '#E11D48', '#BE123C', '#881337'], // Rose
  ['#F8FAFC', '#CBD5E1', '#94A3B8', '#64748B', '#475569', '#334155', '#0F172A'], // Slate
];

interface Props {
  visible: boolean;
  selectedColor: string;
  onSelect: (color: string) => void;
  onClose: () => void;
}

export function ColorPickerModal({ visible, selectedColor, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  function handleSelect(c: string) {
    onSelect(c);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('common.color')}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {COLOR_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => handleSelect(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    selectedColor === c && styles.swatchSelected,
                    selectedColor === c && { borderColor: colors.text },
                  ]}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  body: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 8 },
  swatch: { flex: 1, aspectRatio: 1, borderRadius: 8 },
  swatchSelected: { borderWidth: 3 },
});
