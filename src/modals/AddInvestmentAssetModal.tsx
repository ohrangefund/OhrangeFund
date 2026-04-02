import { useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, BarChart2, TrendingUp, Bitcoin, Check, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { addInvestmentAsset } from '@/api/investmentAssets';
import { SUPPORTED_ASSETS } from '@/api/investmentPrices';
import type { AssetType } from '@/types/models';

interface Props {
  visible: boolean;
  investmentAccountId: string;
  existingTickers: string[];
  onClose: () => void;
}

function AssetTypeIcon({ type, color }: { type: AssetType; color: string }) {
  const size = 16;
  if (type === 'crypto') return <Bitcoin size={size} color={color} />;
  if (type === 'stock') return <TrendingUp size={size} color={color} />;
  return <BarChart2 size={size} color={color} />;
}

export function AddInvestmentAssetModal({
  visible, investmentAccountId, existingTickers, onClose,
}: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableAssets = SUPPORTED_ASSETS.filter(
    (a) => !existingTickers.includes(a.ticker),
  );

  const filteredAssets = query.trim() === ''
    ? availableAssets
    : availableAssets.filter((a) =>
        a.ticker.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase()),
      );

  function handleClose() { setSelected(null); setQuery(''); setError(''); onClose(); }

  async function handleAdd() {
    if (!selected || !user) return;
    const asset = SUPPORTED_ASSETS.find((a) => a.ticker === selected);
    if (!asset) return;
    setLoading(true);
    setError('');
    try {
      await addInvestmentAsset(user.uid, investmentAccountId, {
        ticker: asset.ticker,
        name: asset.name,
        type: asset.type,
      });
      handleClose();
    } catch {
      setError(t('common.errorSave'));
    } finally {
      setLoading(false);
    }
  }

  const typeColors: Record<AssetType, string> = {
    etf: colors.primary,
    stock: colors.income,
    crypto: '#F97316',
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('investments.addAssetTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Search input */}
          <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('investments.searchPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              value={query}
              onChangeText={(v) => { setQuery(v); setSelected(null); }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); setSelected(null); }} hitSlop={8}>
                <X size={14} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          {availableAssets.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('investments.allAssetsAdded')}
              </Text>
            </View>
          ) : filteredAssets.length === 0 ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('investments.noSearchResults')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredAssets}
              keyExtractor={(item) => item.ticker}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = selected === item.ticker;
                const iconColor = typeColors[item.type];
                return (
                  <Pressable
                    onPress={() => setSelected(isSelected ? null : item.ticker)}
                    style={({ pressed }) => [
                      styles.assetRow,
                      {
                        backgroundColor: isSelected ? colors.primary + '18' : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
                      <AssetTypeIcon type={item.type} color={iconColor} />
                    </View>
                    <View style={styles.assetInfo}>
                      <Text style={[styles.ticker, { color: colors.text }]}>{item.ticker}</Text>
                      <Text style={[styles.assetName, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: iconColor + '22' }]}>
                      <Text style={[styles.typeText, { color: iconColor }]}>
                        {item.type.toUpperCase()}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={colors.primary} style={{ marginLeft: 8 }} />}
                  </Pressable>
                );
              }}
            />
          )}

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleAdd}
              disabled={!selected || loading}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: (!selected || loading || pressed) ? 0.5 : 1,
                },
              ]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t('investments.addAssetBtn')}</Text>
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
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  error: { fontSize: 14, marginHorizontal: 16, marginTop: 8 },
  list: { padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15 },
  assetRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1.5, gap: 12,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  assetInfo: { flex: 1 },
  ticker: { fontSize: 15, fontWeight: '700' },
  assetName: { fontSize: 12, marginTop: 2 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  typeText: { fontSize: 10, fontWeight: '700' },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
