import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { TransactionItem } from '@/components/shared/TransactionItem';
import { AddTransactionModal } from '@/modals/AddTransactionModal';
import { EditTransactionModal } from '@/modals/EditTransactionModal';
import { formatCurrency } from '@/utils/currency';
import type { Transaction } from '@/types/models';
import type { AccountsStackParamList } from '@/types/navigation';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<AccountsStackParamList, 'AccountDetail'>;

export function AccountDetailScreen({ route }: Props) {
  const { colors } = useTheme();
  const { accounts } = useAccounts();
  const account = accounts.find((a) => a.id === route.params.accountId);
  const { transactions, loading, hasMore, loadMore } = useTransactions(route.params.accountId);
  const { categories } = useCategories();

  const [showAdd, setShowAdd] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              category={categories.find((c) => c.id === item.category_id)}
              onPress={() => setEditTransaction(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Sem transações. Adiciona a primeira!
              </Text>
            </View>
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable onPress={loadMore} style={styles.loadMore}>
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>Carregar mais</Text>
              </Pressable>
            ) : null
          }
        />
      )}

      <Pressable
        onPress={() => setShowAdd(true)}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <AddTransactionModal
        visible={showAdd}
        account={account}
        onClose={() => setShowAdd(false)}
      />
      <EditTransactionModal
        transaction={editTransaction}
        account={account}
        onClose={() => setEditTransaction(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { margin: 16, borderRadius: 16, padding: 20, alignItems: 'center' },
  balance: { fontSize: 32, fontWeight: '700' },
  label: { fontSize: 13, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15 },
  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
});
