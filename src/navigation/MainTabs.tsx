import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { DrawerProvider, useDrawer } from '@/context/DrawerContext';
import { HomeStack } from '@/navigation/stacks/HomeStack';
import { AccountsStack } from '@/navigation/stacks/AccountsStack';
import { ScheduledStack } from '@/navigation/stacks/ScheduledStack';
import { AnalyticsStack } from '@/navigation/stacks/AnalyticsStack';
import { InvestmentsStack } from '@/navigation/stacks/InvestmentsStack';
import { SettingsStack } from '@/navigation/stacks/SettingsStack';
import { AppHeader } from '@/components/ui/AppHeader';
import { DrawerMenu } from '@/components/ui/DrawerMenu';
import { CategoriesScreen } from '@/screens/settings/CategoriesScreen';
import type { MainTabsParamList } from '@/types/navigation';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator<MainTabsParamList>();


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
        <Tab.Screen name="Analytics" component={AnalyticsStack} />
        <Tab.Screen name="Investments" component={InvestmentsStack} />
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
