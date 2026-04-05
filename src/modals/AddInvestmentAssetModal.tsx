import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, BarChart2, TrendingUp, Bitcoin, Check, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { addInvestmentAsset } from '@/api/investmentAssets';
import { searchTickers, type TickerSearchResult } from '@/api/investmentPrices';
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

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TickerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<TickerSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSelected(null);
    const timer = setTimeout(() => {
      searchTickers(query)
        .then((r) => setResults(r.filter((a) => !existingTickers.includes(a.ticker))))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [query, existingTickers]);

  function handleClose() {
    setQuery(''); setResults([]); setSelected(null); setError('');
    onClose();
  }

  async function handleAdd() {
    if (!selected || !user) return;
    setLoading(true);
    setError('');
    try {
      await addInvestmentAsset(user.uid, investmentAccountId, {
        ticker: selected.ticker,
        name: selected.name,
        type: selected.type,
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

  const showEmpty = !searching && query.trim().length > 0 && results.length === 0;
  const showHint  = !searching && query.trim().length === 0;

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

          <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {searching
              ? <ActivityIndicator size="small" color={colors.textSecondary} />
              : <Search size={16} color={colors.textSecondary} />
            }
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('investments.searchPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); setSelected(null); }} hitSlop={8}>
                <X size={14} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

          {showHint && (
            <View style={styles.hint}>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                {t('investments.searchHint')}
              </Text>
            </View>
          )}

          {showEmpty && (
            <View style={styles.hint}>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                {t('investments.noSearchResults')}
              </Text>
            </View>
          )}

          <FlatList
            data={results}
            keyExtractor={(item) => item.ticker}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const isSelected = selected?.ticker === item.ticker;
              const iconColor = typeColors[item.type];
              return (
                <Pressable
                  onPress={() => setSelected(isSelected ? null : item)}
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
                  <View style={styles.rightSide}>
                    <View style={[styles.typeBadge, { backgroundColor: iconColor + '22' }]}>
                      <Text style={[styles.typeText, { color: iconColor }]}>{item.type.toUpperCase()}</Text>
                    </View>
                    {item.exchange ? (
                      <Text style={[styles.exchange, { color: colors.textDisabled }]}>{item.exchange}</Text>
                    ) : null}
                  </View>
                  {isSelected && <Check size={18} color={colors.primary} style={{ marginLeft: 6 }} />}
                </Pressable>
              );
            }}
          />

          {selected && (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Pressable
                onPress={handleAdd}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.primary, opacity: (loading || pressed) ? 0.7 : 1 },
                ]}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitText}>{t('investments.addAssetBtn')}</Text>
                }
              </Pressable>
            </View>
          )}
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
    marginHorizontal: 16, marginTop: 14, marginBottom: 8,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  error: { fontSize: 14, marginHorizontal: 16, marginBottom: 4 },
  hint: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hintText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
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
  rightSide: { alignItems: 'flex-end', gap: 4 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  typeText: { fontSize: 10, fontWeight: '700' },
  exchange: { fontSize: 10 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
