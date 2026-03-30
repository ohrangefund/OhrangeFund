import { useEffect, useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import {
  Wallet, CreditCard, Landmark, Banknote, PiggyBank,
  Briefcase, Home, Car, ShoppingBag, Globe, X,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { updateAccount, archiveAccount, deleteAccount } from '@/api/accounts';
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
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [icon, setIcon] = useState(ACCOUNT_ICONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  function handleArchive() {
    if (!account) return;
    Alert.alert(
      account.archived ? 'Desarquivar conta' : 'Arquivar conta',
      account.archived ? 'A conta voltará a aparecer na lista.' : 'A conta ficará oculta mas os dados são mantidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => archiveAccount(account.id, !account.archived).then(onClose) },
      ],
    );
  }

  function handleDelete() {
    if (!account) return;
    Alert.alert(
      'Apagar conta',
      'Esta ação é irreversível. A conta e todos os seus dados serão apagados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: () => deleteAccount(account.id).then(onClose) },
      ],
    );
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

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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

            {/* Ações perigosas */}
            <View style={[styles.dangerSection, { borderTopColor: colors.border }]}>
              <Pressable onPress={handleArchive} style={styles.dangerBtn}>
                <Text style={[styles.dangerText, { color: colors.textSecondary }]}>
                  {account?.archived ? 'Desarquivar conta' : 'Arquivar conta'}
                </Text>
              </Pressable>
              <Pressable onPress={handleDelete} style={styles.dangerBtn}>
                <Text style={[styles.dangerText, { color: colors.error }]}>Apagar conta</Text>
              </Pressable>
            </View>
          </ScrollView>

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
  dangerSection: { marginTop: 32, borderTopWidth: 1, paddingTop: 16 },
  dangerBtn: { paddingVertical: 12 },
  dangerText: { fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
