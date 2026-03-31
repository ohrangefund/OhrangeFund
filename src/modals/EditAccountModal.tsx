import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  Wallet, CreditCard, Landmark, Banknote, PiggyBank,
  Briefcase, Home, Car, ShoppingBag, Globe, X,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { updateAccount, archiveAccount } from '@/api/accounts';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ACCOUNT_COLORS, ACCOUNT_ICONS, type Account } from '@/types/models';

const ICONS_MAP: Record<string, React.FC<{ size: number; color: string }>> = {
  'wallet': Wallet, 'credit-card': CreditCard, 'landmark': Landmark,
  'banknote': Banknote, 'piggy-bank': PiggyBank, 'briefcase': Briefcase,
  'home': Home, 'car': Car, 'shopping-bag': ShoppingBag, 'globe': Globe,
};

interface Props {
  account: Account | null;
  onClose: () => void;
}

export function EditAccountModal({ account, onClose }: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState<typeof ACCOUNT_COLORS[number]>(ACCOUNT_COLORS[0]);
  const [icon, setIcon] = useState<typeof ACCOUNT_ICONS[number]>(ACCOUNT_ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setColor(account.color as typeof ACCOUNT_COLORS[number]);
      setIcon(account.icon as typeof ACCOUNT_ICONS[number]);
      setError('');
    }
  }, [account]);

  async function handleSave() {
    if (!account) return;
    if (!name.trim()) { setError('Introduz um nome.'); return; }
    setError('');
    setLoading(true);
    try {
      await updateAccount(account.id, { name: name.trim(), color, icon });
      onClose();
    } catch {
      setError('Erro ao guardar. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleArchiveConfirm() {
    if (!account) return;
    archiveAccount(account.id, !account.archived).then(onClose);
  }

  return (
    <Modal visible={!!account} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Editar conta</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            <Text style={[styles.label, { color: colors.textSecondary }]}>Nome</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={name}
              onChangeText={setName}
              maxLength={50}
              placeholderTextColor={colors.textDisabled}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Cor</Text>
            <View style={styles.colorGrid}>
              {ACCOUNT_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorSwatch, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: colors.text }]}
                />
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Ícone</Text>
            <View style={styles.iconGrid}>
              {ACCOUNT_ICONS.map((ic) => {
                const Icon = ICONS_MAP[ic];
                const selected = icon === ic;
                return (
                  <Pressable
                    key={ic}
                    onPress={() => setIcon(ic)}
                    style={[
                      styles.iconSwatch,
                      { backgroundColor: selected ? color + '33' : colors.surface, borderColor: selected ? color : colors.border },
                    ]}
                  >
                    <Icon size={22} color={selected ? color : colors.textSecondary} />
                  </Pressable>
                );
              })}
            </View>

          </ScrollView>

          <View style={[styles.dangerSection, { borderTopColor: colors.border }]}>
            <Pressable onPress={() => setShowArchiveConfirm(true)} style={styles.dangerBtn}>
              <Text style={[styles.dangerText, { color: account?.archived ? colors.success : colors.error }]}>
                {account?.archived ? 'Ativar conta' : 'Arquivar conta'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSave}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>Guardar</Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      <ConfirmModal
        visible={showArchiveConfirm}
        title={account?.archived ? 'Ativar conta' : 'Arquivar conta'}
        message={account?.archived ? 'A conta voltará a aparecer na lista.' : 'A conta ficará oculta mas os dados são mantidos.'}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setShowArchiveConfirm(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 8 },
  error: { fontSize: 14, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconSwatch: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  dangerSection: { marginTop: 32, borderTopWidth: 1 },
  dangerBtn: { paddingVertical: 16, alignItems: 'center' },
  dangerText: { fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
