import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import type { MainTabsParamList } from '@/types/navigation';

const Tab = createBottomTabNavigator<MainTabsParamList>();

function Placeholder({ name }: { name: string }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{name}</Text>
    </View>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" children={() => <Placeholder name="Home" />} />
      <Tab.Screen name="Transactions" children={() => <Placeholder name="Transações" />} />
      <Tab.Screen name="Analytics" children={() => <Placeholder name="Analytics" />} />
      <Tab.Screen name="Settings" children={() => <Placeholder name="Definições" />} />
    </Tab.Navigator>
  );
}
