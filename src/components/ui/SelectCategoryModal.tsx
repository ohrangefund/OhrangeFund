import { Modal, View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import {
  ShoppingCart, Utensils, Car, Home, HeartPulse, GraduationCap,
  Zap, Plane, Coffee, Briefcase, TrendingUp, TrendingDown, Gift, PiggyBank,
  Banknote, Wallet, Dumbbell, Shirt, Music, X,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import type { Category } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'shopping-cart': ShoppingCart, 'utensils': Utensils, 'car': Car,
  'home': Home, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap,
  'zap': Zap, 'plane': Plane, 'coffee': Coffee, 'briefcase': Briefcase,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'gift': Gift,
  'piggy-bank': PiggyBank, 'banknote': Banknote, 'wallet': Wallet,
  'dumbbell': Dumbbell, 'shirt': Shirt, 'music': Music,
};

interface Props {
  visible: boolean;
  title: string;
  categories: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string) => void;
  onClose: () => void;
}

export function SelectCategoryModal({ visible, title, categories, selectedId, onSelect, onClose }: Props) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const Icon = ICONS[item.icon] ?? ShoppingCart;
            const selected = item.id === selectedId;
            return (
              <Pressable
                onPress={() => { onSelect(item.id); onClose(); }}
                style={[
                  styles.item,
                  {
                    backgroundColor: selected ? item.color + '22' : colors.surface,
                    borderColor: selected ? item.color : 'transparent',
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
                  <Icon size={18} color={item.color} />
                </View>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                {selected && (
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                )}
              </Pressable>
            );
          }}
        />
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
  list: { padding: 16 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '500' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
