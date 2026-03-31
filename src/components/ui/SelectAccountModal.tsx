import { Modal, View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import {
  Wallet, CreditCard, Landmark, Banknote, PiggyBank,
  Briefcase, Home, Car, ShoppingBag, Globe, X, Layers,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { formatCurrency } from '@/utils/currency';
import type { Account } from '@/types/models';

const ICONS: Record<string, React.FC<{ size: number; color: string }>> = {
  'wallet': Wallet, 'credit-card': CreditCard, 'landmark': Landmark,
  'banknote': Banknote, 'piggy-bank': PiggyBank, 'briefcase': Briefcase,
  'home': Home, 'car': Car, 'shopping-bag': ShoppingBag, 'globe': Globe,
};

interface Props {
  visible: boolean;
  accounts: Account[];
  selectedId: string | null;
  onSelect: (account: Account) => void;
  onSelectTotal: () => void;
  onClose: () => void;
}

export function SelectAccountModal({ visible, accounts, selectedId, onSelect, onSelectTotal, onClose }: Props) {
  const { colors } = useTheme();
  const totalSelected = selectedId === null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Selecionar conta</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Geral option */}
          <Pressable
            onPress={() => { onSelectTotal(); onClose(); }}
            style={({ pressed }) => [
              styles.item,
              styles.geralItem,
              {
                backgroundColor: totalSelected ? colors.primary + '22' : colors.surfaceAlt,
                borderColor: totalSelected ? colors.primary : 'transparent',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '22' }]}>
              <Layers size={18} color={colors.primary} />
            </View>
            <Text style={[styles.name, { color: colors.text, fontWeight: '600' }]}>Geral</Text>
            <Text style={[styles.balance, { color: colors.textSecondary }]}>Todas as contas</Text>
          </Pressable>

          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const Icon = ICONS[item.icon] ?? Wallet;
              const selected = item.id === selectedId;
              return (
                <Pressable
                  onPress={() => onSelect(item)}
                  style={({ pressed }) => [
                    styles.item,
                    {
                      backgroundColor: selected ? item.color + '22' : colors.surfaceAlt,
                      borderColor: selected ? item.color : 'transparent',
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
                    <Icon size={18} color={item.color} />
                  </View>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.balance, { color: colors.textSecondary }]}>{formatCurrency(item.balance)}</Text>
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  sheet: {
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: '700' },
  geralItem: { marginHorizontal: 16, marginTop: 12 },
  list: { padding: 16, paddingBottom: 32 },
  item: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  name: { flex: 1, fontSize: 15, fontWeight: '500' },
  balance: { fontSize: 14 },
});
