import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ShoppingCart, Utensils, Car, Home, HeartPulse, GraduationCap,
  Zap, Plane, Coffee, Briefcase, TrendingUp, TrendingDown, Gift, PiggyBank,
  Banknote, Wallet, Dumbbell, Shirt, Music,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import type { Category } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'shopping-cart': ShoppingCart, 'utensils': Utensils, 'car': Car,
  'home': Home, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap,
  'zap': Zap, 'plane': Plane, 'coffee': Coffee, 'briefcase': Briefcase,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'gift': Gift, 'piggy-bank': PiggyBank,
  'banknote': Banknote, 'wallet': Wallet, 'dumbbell': Dumbbell,
  'shirt': Shirt, 'music': Music,
};

interface CategoryItemProps {
  category: Category;
  onPress: () => void;
}

export function CategoryItem({ category, onPress }: CategoryItemProps) {
  const { colors } = useTheme();
  const Icon = ICONS[category.icon] ?? ShoppingCart;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: category.color + '22' }]}>
        <Icon size={18} color={category.color} />
      </View>
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {category.name}
      </Text>
      {category.is_default && (
        <Text style={[styles.badge, { color: colors.textDisabled }]}>default</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 8,
    padding: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '500' },
  badge: { fontSize: 12, marginLeft: 8 },
});
