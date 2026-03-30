import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { HomeStack } from '@/navigation/stacks/HomeStack';
import { SettingsStack } from '@/navigation/stacks/SettingsStack';
import type { MainTabsParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function Placeholder({ name }: { name: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>{name}</Text>
    </View>
  );
}

export function MainTabs() {
  const { colors } = useTheme();

  const screenOptions = useMemo(() => ({
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
  }), [colors]);

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Home" component={HomeStack} options={{ headerShown: false }} />
      <Tab.Screen name="Transactions" options={{ title: 'Transações' }} children={() => <Placeholder name="Transações" />} />
      <Tab.Screen name="Analytics" children={() => <Placeholder name="Analytics" />} />
      <Tab.Screen name="Settings" component={SettingsStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}
