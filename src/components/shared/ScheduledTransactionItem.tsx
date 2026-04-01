import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ShoppingCart, Utensils, Car, Home, HeartPulse, GraduationCap,
  Zap, Plane, Coffee, Briefcase, TrendingUp, TrendingDown, Gift, PiggyBank,
  Banknote, Wallet, Dumbbell, Shirt, Music,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { ScheduledTransaction, Account, Category } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'shopping-cart': ShoppingCart, 'utensils': Utensils, 'car': Car,
  'home': Home, 'heart-pulse': HeartPulse, 'graduation-cap': GraduationCap,
  'zap': Zap, 'plane': Plane, 'coffee': Coffee, 'briefcase': Briefcase,
  'trending-up': TrendingUp, 'trending-down': TrendingDown, 'gift': Gift,
  'piggy-bank': PiggyBank, 'banknote': Banknote, 'wallet': Wallet,
  'dumbbell': Dumbbell, 'shirt': Shirt, 'music': Music,
};

interface Props {
  item: ScheduledTransaction;
  accounts: Account[];
  categories: Category[];
  onPress: () => void;
}

export function ScheduledTransactionItem({ item, accounts, categories, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const category = categories.find((c) => c.id === item.category_id);
  const account = accounts.find((a) => a.id === item.account_id);
  const Icon = ICONS[category?.icon ?? ''] ?? ShoppingCart;
  const iconColor = category?.color ?? colors.textSecondary;
  const amountColor = item.type === 'income' ? colors.income : colors.expense;
  const amountPrefix = item.type === 'income' ? '+' : '-';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
        <Icon size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
          {item.description || category?.name || '—'}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {account?.name ?? '—'} · {formatDate(item.next_date)}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {t(`modalScheduledTxn.${item.recurrence}` as any)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {amountPrefix}{formatCurrency(item.amount)}
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
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaText: { fontSize: 12 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  amount: { fontSize: 15, fontWeight: '600' },
});
