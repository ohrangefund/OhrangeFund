import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRightLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currency';
import { formatRelativeDate } from '@/utils/date';
import type { Transfer, Account } from '@/types/models';

interface Props {
  transfer: Transfer;
  currentAccountId?: string | null;
  accounts: Account[];
  onPress: () => void;
}

export function TransferItem({ transfer, currentAccountId, accounts, onPress }: Props) {
  const { colors } = useTheme();
  const isHistory = !currentAccountId;
  const isOutgoing = !isHistory && transfer.from_account_id === currentAccountId;
  const fromAccount = accounts.find((a) => a.id === transfer.from_account_id);
  const toAccount = accounts.find((a) => a.id === transfer.to_account_id);
  const otherAccountId = isOutgoing ? transfer.to_account_id : transfer.from_account_id;
  const otherAccount = accounts.find((a) => a.id === otherAccountId);
  const amountColor = isHistory ? colors.text : isOutgoing ? colors.expense : colors.income;
  const amountPrefix = isHistory ? '' : isOutgoing ? '-' : '+';
  const defaultLabel = isHistory
    ? `${fromAccount?.name ?? '—'} → ${toAccount?.name ?? '—'}`
    : isOutgoing
    ? `→ ${otherAccount?.name ?? '—'}`
    : `← ${otherAccount?.name ?? '—'}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
        <ArrowRightLeft size={18} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
          {transfer.description || defaultLabel}
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {formatRelativeDate(transfer.date)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {amountPrefix}{formatCurrency(transfer.amount)}
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
