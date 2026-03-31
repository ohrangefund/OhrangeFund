import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Wallet, CreditCard, Landmark, Banknote, PiggyBank,
  Briefcase, Home, Car, ShoppingBag, Globe,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currency';
import type { Account } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'wallet': Wallet,
  'credit-card': CreditCard,
  'landmark': Landmark,
  'banknote': Banknote,
  'piggy-bank': PiggyBank,
  'briefcase': Briefcase,
  'home': Home,
  'car': Car,
  'shopping-bag': ShoppingBag,
  'globe': Globe,
};

interface AccountCardProps {
  account: Account;
  onPress: () => void;
}

export function AccountCard({ account, onPress }: AccountCardProps) {
  const { colors } = useTheme();
  const Icon = ICONS[account.icon] ?? Wallet;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: account.color }]} />
      <View style={[styles.iconWrap, { backgroundColor: account.color + '22' }]}>
        <Icon size={20} color={account.color} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {account.name}
        </Text>
        <Text style={[styles.balance, { color: colors.text }]}>
          {formatCurrency(account.balance)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 14,
  },
  info: {
    flex: 1,
    paddingRight: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  balance: {
    fontSize: 15,
    fontWeight: '600',
  },
});
