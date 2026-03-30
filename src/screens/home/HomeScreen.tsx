import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, PenLine } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { AccountCard } from '@/components/shared/AccountCard';
import { AddAccountModal } from '@/modals/AddAccountModal';
import { EditAccountModal } from '@/modals/EditAccountModal';
import { formatCurrency } from '@/utils/currency';
import type { Account } from '@/types/models';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMain'>;

export function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { accounts, totalBalance, loading } = useAccounts();
  const [showAdd, setShowAdd] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Net Worth */}
      <View style={[styles.netWorth, { backgroundColor: colors.surface }]}>
        <Text style={[styles.netWorthLabel, { color: colors.textSecondary }]}>Saldo total</Text>
        <Text style={[styles.netWorthAmount, { color: colors.text }]}>{formatCurrency(totalBalance)}</Text>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cardRow}>
            <AccountCard
              account={item}
              onPress={() => navigation.navigate('AccountDetail', { accountId: item.id })}
            />
            <Pressable onPress={() => setEditAccount(item)} style={styles.editBtn} hitSlop={8}>
              <PenLine size={16} color={colors.textSecondary} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Sem contas. Cria a primeira!
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => setShowAdd(true)}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <AddAccountModal visible={showAdd} onClose={() => setShowAdd(false)} />
      <EditAccountModal account={editAccount} onClose={() => setEditAccount(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  netWorth: {
    margin: 16, borderRadius: 16, padding: 20,
    alignItems: 'center',
  },
  netWorthLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  netWorthAmount: { fontSize: 32, fontWeight: '700' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  editBtn: { paddingLeft: 8, paddingBottom: 10 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
});
