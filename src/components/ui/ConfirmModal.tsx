import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ visible, title, message, confirmLabel = 'Confirmar', onConfirm, onCancel }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </Pressable>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.confirmText, { color: colors.error }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 40,
  },
  card: {
    width: '100%', borderRadius: 16, overflow: 'hidden',
  },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 6 },
  message: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 20, lineHeight: 20 },
  divider: { height: 1 },
  actions: { flexDirection: 'row' },
  btn: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 15 },
  confirmText: { fontSize: 15, fontWeight: '600' },
  separator: { width: 1 },
});
