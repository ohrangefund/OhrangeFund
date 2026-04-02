import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { X, ChevronRight, CalendarDays, TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { buyAsset } from '@/api/investmentTransactions';
import { getAssetPrice } from '@/api/investmentPrices';
import { SelectAccountModal } from '@/components/ui/SelectAccountModal';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { amountToCents, formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import type { InvestmentAsset, Account } from '@/types/models';

interface Props {
  visible: boolean;
  investmentAccountId: string;
  assets: InvestmentAsset[];
  accounts: Account[];
  onClose: () => void;
}

export function BuyAssetModal({
  visible, investmentAccountId, assets, accounts, onClose,
}: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [description, setDescription] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch price when asset changes
  useEffect(() => {
    if (!selectedAsset) { setCurrentPrice(null); return; }
    setPriceLoading(true);
    getAssetPrice(selectedAsset.ticker)
      .then(setCurrentPrice)
      .finally(() => setPriceLoading(false));
  }, [selectedAsset]);

  const amountCents = amountToCents(parseFloat(amount.replace(',', '.') || '0'));
  const estimatedQty = (currentPrice && amountCents > 0)
    ? amountCents / currentPrice
    : null;

  function reset() {
    setSelectedAsset(null); setSelectedAccount(null); setAmount('');
    setSelectedDate(new Date()); setDescription(''); setCurrentPrice(null);
    setError('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    if (!selectedAsset) { setError(t('investments.selectAsset')); return; }
    if (!selectedAccount) { setError(t('modalTransaction.selectAccount')); return; }
    const cents = amountToCents(parseFloat(amount.replace(',', '.')));
    if (isNaN(cents) || cents <= 0) { setError(t('common.invalidAmount')); return; }

    setError('');
    setLoading(true);
    try {
      await buyAsset(
        user!.uid,
        investmentAccountId,
        {
          asset_id: selectedAsset.id,
          ticker: selectedAsset.ticker,
          account_id: selectedAccount.id,
          amount: cents,
          date: selectedDate,
          description: description.trim() || null,
        },
        assets,
      );
      handleClose();
    } catch (e: any) {
      setError(t('investments.errorBuy'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('investments.buyTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

            {/* Asset selector */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('investments.assetLabel')}</Text>
            <Pressable
              onPress={() => setShowAssetPicker(true)}
              style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {selectedAsset ? (
                <View style={styles.selectorContent}>
                  <View style={[styles.selectorIcon, { backgroundColor: colors.primary + '22' }]}>
                    <TrendingUp size={16} color={colors.primary} />
                  </View>
                  <Text style={[styles.selectorText, { color: colors.text }]}>
                    {selectedAsset.ticker} — {selectedAsset.name}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.selectorText, { color: colors.textDisabled }]}>
                  {t('investments.selectAsset')}
                </Text>
              )}
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Current price display */}
            {selectedAsset && (
              <View style={[styles.priceBox, { backgroundColor: colors.surface }]}>
                {priceLoading
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Text style={[styles.priceText, { color: colors.textSecondary }]}>
                      {t('investments.currentPrice')}: {currentPrice !== null ? formatCurrency(currentPrice) : '—'}
                    </Text>
                }
              </View>
            )}

            {/* Account */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('investments.debitAccount')}</Text>
            <Pressable
              onPress={() => setShowAccountPicker(true)}
              style={[styles.selector, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {selectedAccount ? (
                <View style={styles.selectorContent}>
                  <View style={[styles.selectorIcon, { backgroundColor: selectedAccount.color + '22' }]}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedAccount.color }} />
                  </View>
                  <Text style={[styles.selectorText, { color: colors.text }]}>{selectedAccount.name}</Text>
                </View>
              ) : (
                <Text style={[styles.selectorText, { color: colors.textDisabled }]}>{t('common.selectAccount')}</Text>
              )}
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Amount */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.amount')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="0,00"
              placeholderTextColor={colors.textDisabled}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />

            {/* Estimated quantity */}
            {estimatedQty !== null && (
              <View style={[styles.estimateBox, { backgroundColor: colors.primary + '14' }]}>
                <Text style={[styles.estimateText, { color: colors.primary }]}>
                  ≈ {estimatedQty % 1 < 0.0001 ? estimatedQty.toFixed(0) : estimatedQty.toFixed(6)} {t('investments.units')} {selectedAsset?.ticker}
                </Text>
              </View>
            )}

            {/* Date */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.date')}</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={({ pressed }) => [styles.selector, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <CalendarDays size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <Text style={[styles.selectorText, { color: colors.text }]}>{formatDate(selectedDate)}</Text>
              <ChevronRight size={16} color={colors.textSecondary} />
            </Pressable>

            {/* Description */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('common.description')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder={t('investments.descPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              value={description}
              onChangeText={setDescription}
              maxLength={100}
            />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.income, opacity: pressed ? 0.8 : 1 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t('investments.buyBtn')}</Text>
              }
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sub-modals */}
      <Modal visible={showAssetPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAssetPicker(false)}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{t('investments.selectAsset')}</Text>
            <Pressable onPress={() => setShowAssetPicker(false)} hitSlop={8}>
              <X size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body}>
            {assets.map((asset) => (
              <Pressable
                key={asset.id}
                onPress={() => { setSelectedAsset(asset); setShowAssetPicker(false); }}
                style={({ pressed }) => [
                  styles.assetRow,
                  {
                    backgroundColor: selectedAsset?.id === asset.id ? colors.primary + '18' : colors.surface,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text style={[styles.assetTicker, { color: colors.text }]}>{asset.ticker}</Text>
                <Text style={[styles.assetName, { color: colors.textSecondary }]}>{asset.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <SelectAccountModal
        visible={showAccountPicker}
        accounts={accounts}
        selectedId={selectedAccount?.id ?? null}
        onSelect={(a) => { setSelectedAccount(a); setShowAccountPicker(false); }}
        onClose={() => setShowAccountPicker(false)}
        showTotal={false}
      />
      <DatePickerModal
        visible={showDatePicker}
        selected={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setShowDatePicker(false)}
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
  selector: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  selectorContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  selectorIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  selectorText: { flex: 1, fontSize: 16 },
  priceBox: { borderRadius: 10, padding: 12, marginTop: 8, alignItems: 'center' },
  priceText: { fontSize: 14, fontWeight: '500' },
  estimateBox: { borderRadius: 10, padding: 12, marginTop: 8, alignItems: 'center' },
  estimateText: { fontSize: 14, fontWeight: '600' },
  assetRow: {
    borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  assetTicker: { fontSize: 15, fontWeight: '700', width: 60 },
  assetName: { flex: 1, fontSize: 14 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
