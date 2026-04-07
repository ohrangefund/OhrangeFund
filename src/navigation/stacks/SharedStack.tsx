import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { SharedAccountsScreen } from '@/screens/shared/SharedAccountsScreen';
import type { SharedStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<SharedStackParamList>();

export function SharedStack() {
  const { colors } = useTheme();

  const screenOptions = useMemo(() => ({
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text },
  }), [colors]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SharedMain" component={SharedAccountsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
