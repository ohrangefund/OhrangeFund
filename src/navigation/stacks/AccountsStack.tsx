import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AccountsScreen } from '@/screens/accounts/AccountsScreen';
import { AccountDetailScreen } from '@/screens/home/AccountDetailScreen';
import type { AccountsStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AccountsStackParamList>();

export function AccountsStack() {
  const { colors } = useTheme();

  const screenOptions = useMemo(() => ({
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text },
  }), [colors]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AccountsMain" component={AccountsScreen} options={{ title: 'Contas' }} />
      <Stack.Screen name="AccountDetail" component={AccountDetailScreen} options={{ title: 'Conta' }} />
    </Stack.Navigator>
  );
}
