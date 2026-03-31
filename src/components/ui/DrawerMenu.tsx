import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Home, Wallet, CalendarClock, BarChart2, Tag, Settings } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useDrawer } from '@/context/DrawerContext';

const DRAWER_WIDTH = 280;

const MENU_ITEMS = [
  { key: 'Home',       label: 'Início',         Icon: Home },
  { key: 'Accounts',  label: 'Contas',          Icon: Wallet },
  { key: 'Scheduled', label: 'Agendamentos',    Icon: CalendarClock },
  { key: 'Analytics', label: 'Gráficos',        Icon: BarChart2 },
  { key: 'Categories',label: 'Categorias',      Icon: Tag },
  { key: 'Settings',  label: 'Configurações',   Icon: Settings },
];

export function DrawerMenu() {
  const { colors } = useTheme();
  const { isOpen, close, activeTab, navigateTo } = useDrawer();

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, translateX, overlayOpacity]);

  return (
    <>
      {/* Overlay — pointer events only when open */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents={isOpen ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[styles.drawer, { backgroundColor: colors.surface, transform: [{ translateX }] }]}
      >
        <View style={styles.drawerHeader}>
          <Text style={[styles.appName, { color: colors.primary }]}>OhrangeFund</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {MENU_ITEMS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <Pressable
              key={key}
              onPress={() => navigateTo(key)}
              style={({ pressed }) => [
                styles.item,
                active && [styles.itemActive, { backgroundColor: colors.primary + '18' }],
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: active ? colors.primary + '22' : 'transparent' }]}>
                <Icon size={20} color={active ? colors.primary : colors.textSecondary} />
              </View>
              <Text style={[styles.itemLabel, { color: active ? colors.primary : colors.text, fontWeight: active ? '700' : '500' }]}>
                {label}
              </Text>
              {active && <View style={[styles.activeBar, { backgroundColor: colors.primary }]} />}
            </Pressable>
          );
        })}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  drawer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: DRAWER_WIDTH,
    zIndex: 11,
    paddingTop: 60,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  drawerHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  divider: { height: 1, marginBottom: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    borderRadius: 12,
    marginBottom: 2,
    gap: 14,
  },
  itemActive: {},
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontSize: 15 },
  activeBar: {
    width: 4, height: 20, borderRadius: 2,
  },
});
