import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ShoppingCart, Utensils, Car, Home, HeartPulse, GraduationCap,
  Zap, Plane, Coffee, Briefcase, TrendingUp, TrendingDown, Gift, PiggyBank,
  Banknote, Wallet, Dumbbell, Shirt, Music,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currency';
import { formatRelativeDate } from '@/utils/date';
import type { Transaction, Category } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'shopping-cart': ShoppingCart, 'utensils': Utensils, 'car': Car,
  'home': Home, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap,
  'zap': Zap, 'plane': Plane, 'coffee': Coffee, 'briefcase': Briefcase,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'gift': Gift,
  'piggy-bank': PiggyBank, 'banknote': Banknote, 'wallet': Wallet,
  'dumbbell': Dumbbell, 'shirt': Shirt, 'music': Music,
};

interface TransactionItemProps {
  transaction: Transaction;
  category: Category | undefined;
  onPress: () => void;
}

export function TransactionItem({ transaction, category, onPress }: TransactionItemProps) {
  const { colors } = useTheme();
  const Icon = ICONS[category?.icon ?? ''] ?? ShoppingCart;
  const iconColor = category?.color ?? colors.textSecondary;
  const amountColor = transaction.type === 'income' ? colors.income : colors.expense;
  const amountPrefix = transaction.type === 'income' ? '+' : '-';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
        <Icon size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
          {transaction.description || category?.name || '—'}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatRelativeDate(transaction.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {amountPrefix}{formatCurrency(transaction.amount)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, marginBottom: 8, padding: 14,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1, marginRight: 12 },
  label: { fontSize: 15, fontWeight: '500' },
  date: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '600' },
});
