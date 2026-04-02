import { View, Text, Pressable, StyleSheet } from 'react-native';
import { TrendingUp, Bitcoin, BarChart2, Trash2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currency';
import type { InvestmentAsset } from '@/types/models';

interface Props {
  asset: InvestmentAsset;
  currentPrice: number;   // cents
  onRemove?: () => void;
}

function AssetIcon({ type, color }: { type: string; color: string }) {
  const size = 18;
  if (type === 'crypto') return <Bitcoin size={size} color={color} />;
  if (type === 'stock') return <TrendingUp size={size} color={color} />;
  return <BarChart2 size={size} color={color} />;
}

export function InvestmentAssetItem({ asset, currentPrice, onRemove }: Props) {
  const { colors } = useTheme();
  const totalValue = Math.round(asset.quantity * currentPrice);
  const iconColor = colors.primary;

  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
        <AssetIcon type={asset.type} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.ticker, { color: colors.text }]}>{asset.ticker}</Text>
        <Text style={[styles.name, { color: colors.textSecondary }]} numberOfLines={1}>
          {asset.name}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.value, { color: colors.text }]}>
          {formatCurrency(totalValue)}
        </Text>
        <Text style={[styles.qty, { color: colors.textSecondary }]}>
          {asset.quantity % 1 === 0
            ? asset.quantity.toFixed(0)
            : asset.quantity.toFixed(4)} un · {formatCurrency(currentPrice)}
        </Text>
      </View>
      {onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={({ pressed }) => [styles.removeBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Trash2 size={16} color={colors.textDisabled} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1 },
  ticker: { fontSize: 15, fontWeight: '700' },
  name: { fontSize: 12, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  value: { fontSize: 15, fontWeight: '700' },
  qty: { fontSize: 11, marginTop: 2 },
  removeBtn: { padding: 4 },
});
