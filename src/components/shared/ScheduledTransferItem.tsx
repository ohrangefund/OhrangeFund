import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRightLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { ScheduledTransfer, Account } from '@/types/models';

interface Props {
  item: ScheduledTransfer;
  accounts: Account[];
  onPress: () => void;
}

export function ScheduledTransferItem({ item, accounts, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const fromAccount = accounts.find((a) => a.id === item.from_account_id);
  const toAccount = accounts.find((a) => a.id === item.to_account_id);
  const label = item.description || `${fromAccount?.name ?? '—'} → ${toAccount?.name ?? '—'}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, { backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
        <ArrowRightLeft size={18} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {formatDate(item.next_date)}
          </Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {t(`modalScheduledTxn.${item.recurrence}` as any)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[styles.amount, { color: colors.text }]}>
        {formatCurrency(item.amount)}
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
