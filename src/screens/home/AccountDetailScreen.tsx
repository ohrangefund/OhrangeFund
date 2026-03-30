import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/utils/currency';
import type { HomeStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<HomeStackParamList, 'AccountDetail'>;

export function AccountDetailScreen({ route }: Props) {
  const { colors } = useTheme();
  const { accounts } = useAccounts();
  const account = accounts.find((a) => a.id === route.params.accountId);

  if (!account) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>Conta não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.balance, { color: colors.text }]}>{formatCurrency(account.balance)}</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Saldo atual</Text>
      </View>
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Sem transações. (Fase 4)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { margin: 16, borderRadius: 16, padding: 20, alignItems: 'center' },
  balance: { fontSize: 32, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15 },
});
