import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// Monday-first offset: Mon=0 ... Sun=6
function mondayOffset(date: Date) {
  return (date.getDay() + 6) % 7;
}

interface Props {
  visible: boolean;
  selected: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
  allowFuture?: boolean;
}

export function DatePickerModal({ visible, selected, onSelect, onClose, allowFuture = false }: Props) {
  const { colors } = useTheme();
  const today = new Date();

  const [cursor, setCursor] = useState<Date>(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  function prevMonth() {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  }

  const isCurrentMonth =
    !allowFuture &&
    cursor.getFullYear() === today.getFullYear() && cursor.getMonth() === today.getMonth();

  function nextMonth() {
    if (isCurrentMonth) return;
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  }

  function handleSelect(day: number) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    if (!allowFuture && date > today) return;
    onSelect(date);
    onClose();
  }

  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const offset = mondayOffset(new Date(cursor.getFullYear(), cursor.getMonth(), 1));

  // Build grid: nulls for empty cells, then 1..daysInMonth
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Selecionar data</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Month navigation */}
          <View style={styles.nav}>
            <Pressable onPress={prevMonth} hitSlop={12} style={styles.navBtn}>
              <ChevronLeft size={20} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={12} style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}>
              <ChevronRight size={20} color={isCurrentMonth ? colors.textDisabled : colors.text} />
            </Pressable>
          </View>

          {/* Day names */}
          <View style={styles.dayNames}>
            {DAY_NAMES.map((d) => (
              <Text key={d} style={[styles.dayName, { color: colors.textSecondary }]}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.cell} />;

              const cellDate = new Date(cursor.getFullYear(), cursor.getMonth(), day);
              const isSelected = selected ? isSameDay(cellDate, selected) : false;
              const isToday = isSameDay(cellDate, today);
              const isFuture = !allowFuture && cellDate > today;

              return (
                <Pressable
                  key={day}
                  onPress={() => handleSelect(day)}
                  disabled={isFuture}
                  style={({ pressed }) => [
                    styles.cell,
                    isSelected && [styles.cellSelected, { backgroundColor: colors.primary }],
                    { opacity: isFuture ? 0.25 : pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      { color: isSelected ? '#fff' : isToday ? colors.primary : colors.text },
                      isToday && !isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: '700' },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.3 },
  monthLabel: { fontSize: 16, fontWeight: '600' },
  dayNames: {
    flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4,
  },
  dayName: {
    flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '500',
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16,
  },
  cell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  cellSelected: {
    borderRadius: 100,
  },
  cellToday: {},
  cellText: { fontSize: 14 },
});
