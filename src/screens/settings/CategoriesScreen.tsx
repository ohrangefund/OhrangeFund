import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/hooks/useCategories';
import { CategoryItem } from '@/components/shared/CategoryItem';
import { AddCategoryModal } from '@/modals/AddCategoryModal';
import { EditCategoryModal } from '@/modals/EditCategoryModal';
import type { Category } from '@/types/models';

export function CategoriesScreen() {
  const { colors } = useTheme();
  const { incomeCategories, expenseCategories, loading } = useCategories();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [showAdd, setShowAdd] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const data = activeTab === 'expense' ? expenseCategories : incomeCategories;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(['expense', 'income'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tab,
              activeTab === tab && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? colors.primary : colors.textSecondary },
            ]}>
              {tab === 'expense' ? 'Despesa' : 'Receita'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CategoryItem category={item} onPress={() => setEditCategory(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Sem categorias. Cria a primeira!
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => setShowAdd(true)}
        style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
      >
        <Plus size={26} color="#fff" />
      </Pressable>

      <AddCategoryModal
        visible={showAdd}
        initialType={activeTab}
        onClose={() => setShowAdd(false)}
      />
      <EditCategoryModal
        category={editCategory}
        onClose={() => setEditCategory(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: { fontSize: 15, fontWeight: '600' },
  list: { padding: 16, paddingBottom: 100 },
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
