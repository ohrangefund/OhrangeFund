import { useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  ShoppingCart, Utensils, Car, Home, HeartPulse, GraduationCap,
  Zap, Plane, Coffee, Briefcase, TrendingUp, TrendingDown, Gift, PiggyBank,
  Banknote, Wallet, Dumbbell, Shirt, Music, X,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { createCategory } from '@/api/categories';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/types/models';

const ICONS_MAP: Record<string, React.FC<{ size: number; color: string }>> = {
  'shopping-cart': ShoppingCart, 'utensils': Utensils, 'car': Car,
  'home': Home, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap,
  'zap': Zap, 'plane': Plane, 'coffee': Coffee, 'briefcase': Briefcase,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'gift': Gift, 'piggy-bank': PiggyBank,
  'banknote': Banknote, 'wallet': Wallet, 'dumbbell': Dumbbell,
  'shirt': Shirt, 'music': Music,
};

interface Props {
  visible: boolean;
  initialType?: 'income' | 'expense';
  onClose: () => void;
}

export function AddCategoryModal({ visible, initialType = 'expense', onClose }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState<typeof CATEGORY_COLORS[number]>(CATEGORY_COLORS[0]);
  const [icon, setIcon] = useState<typeof CATEGORY_ICONS[number]>(CATEGORY_ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setName(''); setColor(CATEGORY_COLORS[0]);
    setIcon(CATEGORY_ICONS[0]); setError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    if (!name.trim()) { setError('Introduz um nome.'); return; }
    setError('');
    setLoading(true);
    try {
      await createCategory(user!.uid, { name: name.trim(), type: initialType, color, icon });
      handleClose();
    } catch {
      setError('Erro ao criar categoria. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Nova categoria</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            <View style={styles.typeRow}>
              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 0, marginBottom: 0 }]}>Tipo</Text>
              <View style={[styles.typeBadge, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.typeValue, { color: colors.primary }]}>
                  {initialType === 'expense' ? 'Despesa' : 'Receita'}
                </Text>
              </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Nome</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={initialType === 'expense' ? 'Ex: Restaurantes' : 'Ex: Salário'}
              placeholderTextColor={colors.textDisabled}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Cor</Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorSwatch, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.text }]}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Ícone</Text>
            <View style={styles.iconGrid}>
              {CATEGORY_ICONS.map((ic) => {
                const Icon = ICONS_MAP[ic];
                const selected = icon === ic;
                return (
                  <Pressable
                    key={ic}
                    onPress={() => setIcon(ic)}
                    style={[
                      styles.iconSwatch,
                      { backgroundColor: selected ? color + '33' : colors.surface, borderColor: selected ? color : colors.border },
                    ]}
                  >
                    <Icon size={22} color={selected ? color : colors.textSecondary} />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Criar categoria</Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  body: { padding: 20, paddingBottom: 8 },
  error: { fontSize: 14, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 0 },
  typeBadge: {
    alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  typeValue: { fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconSwatch: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
