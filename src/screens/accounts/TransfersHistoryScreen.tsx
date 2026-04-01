import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useAllTransfers } from '@/hooks/useTransfers';
import { TransferItem } from '@/components/shared/TransferItem';
import { EditTransferModal } from '@/modals/EditTransferModal';
import type { Transfer } from '@/types/models';

export function TransfersHistoryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { accounts } = useAccounts();
  const { transfers, loading, hasMore, loadMore } = useAllTransfers();
  const [editTransfer, setEditTransfer] = useState<Transfer | null>(null);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={transfers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TransferItem transfer={item} accounts={accounts} onPress={() => setEditTransfer(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('transfersHistory.noTransfers')}
            </Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable onPress={loadMore} style={styles.loadMore}>
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>{t('transfersHistory.loadMore')}</Text>
            </Pressable>
          ) : null
        }
      />
      <EditTransferModal transfer={editTransfer} onClose={() => setEditTransfer(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15 },
  loadMore: { alignItems: 'center', paddingVertical: 16 },
  loadMoreText: { fontSize: 14, fontWeight: '600' },
});
