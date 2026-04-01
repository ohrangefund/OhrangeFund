import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { DrawerProvider, useDrawer } from '@/context/DrawerContext';
import { HomeStack } from '@/navigation/stacks/HomeStack';
import { AccountsStack } from '@/navigation/stacks/AccountsStack';
import { ScheduledStack } from '@/navigation/stacks/ScheduledStack';
import { SettingsStack } from '@/navigation/stacks/SettingsStack';
import { AppHeader } from '@/components/ui/AppHeader';
import { DrawerMenu } from '@/components/ui/DrawerMenu';
import { CategoriesScreen } from '@/screens/settings/CategoriesScreen';
import type { MainTabsParamList } from '@/types/navigation';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function Placeholder() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text style={{ fontSize: 40, marginBottom: 16 }}>📊</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 }}>{t('analytics.title')}</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
        {t('analytics.comingSoon')}
      </Text>
    </View>
  );
}

function NavBridge({ navigation }: BottomTabBarProps) {
  const { registerNavigate } = useDrawer();
  useEffect(() => {
    registerNavigate((name) => navigation.navigate(name as never));
  }, [navigation, registerNavigate]);
  return null;
}

function TabsWithDrawer() {
  const { colors } = useTheme();

  const screenOptions = useMemo(() => ({
    headerShown: false,
  }), []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AppHeader />
      <Tab.Navigator screenOptions={screenOptions} tabBar={(props) => <NavBridge {...props} />}>
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Accounts" component={AccountsStack} />
        <Tab.Screen name="Scheduled" component={ScheduledStack} />
        <Tab.Screen name="Analytics" component={Placeholder} />
        <Tab.Screen name="Categories" component={CategoriesScreen} />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>
      <DrawerMenu />
    </View>
  );
}

export function MainTabs() {
  return (
    <DrawerProvider>
      <TabsWithDrawer />
    </DrawerProvider>
  );
}
