import { useState } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  Pressable, StyleSheet,
} from 'react-native';
import {
  Wallet, CreditCard, Landmark, Banknote, PiggyBank,
  TrendingUp, TrendingDown, DollarSign, Receipt, BarChart2,
  Percent, Coins, Calculator,
  ShoppingCart, Utensils, Coffee, Pizza, Apple, Beer, Wine,
  Car, Bus, Bike, Plane, Train, Fuel, Ship, Truck, MapPin,
  Home, Tv, Wrench, Hammer, Package,
  Heart, HeartPulse, Activity, Pill, Baby, Smile,
  ShoppingBag, Shirt, Tag, Watch, Gem, Star,
  Music, Film, Gamepad2, Headphones, Camera,
  GraduationCap, BookOpen, Pen, Briefcase, Building, Laptop,
  Dumbbell, Globe, Sun, Moon, Zap, Gift, Leaf, Droplets, Flame,
  Wifi, Smartphone, Bell, X,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ALL_ICONS } from '@/types/models';

export const ALL_ICONS_MAP: Record<string, React.FC<{ size: number; color: string }>> = {
  'wallet': Wallet, 'credit-card': CreditCard, 'landmark': Landmark, 'banknote': Banknote,
  'piggy-bank': PiggyBank, 'trending-up': TrendingUp, 'trending-down': TrendingDown,
  'dollar-sign': DollarSign, 'receipt': Receipt, 'bar-chart-2': BarChart2,
  'percent': Percent, 'coins': Coins, 'calculator': Calculator,
  'shopping-cart': ShoppingCart, 'utensils': Utensils, 'coffee': Coffee,
  'pizza': Pizza, 'apple': Apple, 'beer': Beer, 'wine': Wine,
  'car': Car, 'bus': Bus, 'bike': Bike, 'plane': Plane, 'train': Train,
  'fuel': Fuel, 'ship': Ship, 'truck': Truck, 'map-pin': MapPin,
  'home': Home, 'tv': Tv, 'wrench': Wrench, 'hammer': Hammer, 'package': Package,
  'heart': Heart, 'heart-pulse': HeartPulse, 'activity': Activity, 'pill': Pill,
  'baby': Baby, 'smile': Smile,
  'shopping-bag': ShoppingBag, 'shirt': Shirt, 'tag': Tag, 'watch': Watch,
  'gem': Gem, 'star': Star,
  'music': Music, 'film': Film, 'gamepad-2': Gamepad2, 'headphones': Headphones, 'camera': Camera,
  'graduation-cap': GraduationCap, 'book-open': BookOpen, 'pen': Pen, 'briefcase': Briefcase,
  'building': Building, 'laptop': Laptop,
  'dumbbell': Dumbbell, 'globe': Globe, 'sun': Sun, 'moon': Moon, 'zap': Zap,
  'gift': Gift, 'leaf': Leaf, 'droplets': Droplets, 'flame': Flame,
  'wifi': Wifi, 'smartphone': Smartphone, 'bell': Bell,
};

interface Props {
  visible: boolean;
  selectedIcon: string;
  selectedColor: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export function IconPickerModal({ visible, selectedIcon, selectedColor, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = query.trim() === ''
    ? [...ALL_ICONS]
    : [...ALL_ICONS].filter((ic) => ic.includes(query.toLowerCase().replace(/\s+/g, '-')));

  function handleSelect(ic: string) {
    onSelect(ic);
    setQuery('');
    onClose();
  }

  function handleClose() {
    setQuery('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{t('common.icon')}</Text>
          <Pressable onPress={handleClose} hitSlop={8}>
            <X size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('common.search')}
            placeholderTextColor={colors.textDisabled}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {filtered.map((ic) => {
            const Icon = ALL_ICONS_MAP[ic];
            if (!Icon) return null;
            const selected = ic === selectedIcon;
            return (
              <Pressable
                key={ic}
                onPress={() => handleSelect(ic)}
                style={[
                  styles.iconSwatch,
                  {
                    backgroundColor: selected ? selectedColor + '33' : colors.surface,
                    borderColor: selected ? selectedColor : colors.border,
                  },
                ]}
              >
                <Icon size={22} color={selected ? selectedColor : colors.textSecondary} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
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
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { fontSize: 15 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    padding: 16,
  },
  iconSwatch: {
    width: 52, height: 52, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
});
