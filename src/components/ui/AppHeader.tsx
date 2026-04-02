import { View, Text, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { Menu } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useDrawer } from '@/context/DrawerContext';

export function AppHeader() {
  const { colors } = useTheme();
  const { open, navigateTo } = useDrawer();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <Pressable onPress={open} hitSlop={12} style={styles.menuBtn}>
        <Menu size={22} color={colors.text} />
      </Pressable>
      <Pressable onPress={() => navigateTo('Home')} hitSlop={8} style={styles.titleWrap}>
        <Text style={[styles.title, { color: colors.primary }]}>OhrangeFund</Text>
      </Pressable>
    </View>
  );
}

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

const styles = StyleSheet.create({
  container: {
    paddingTop: STATUS_BAR_HEIGHT + 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  menuBtn: {
    width: 36,
    alignItems: 'flex-start',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
