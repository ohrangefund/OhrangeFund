import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { AccountsScreen } from '@/screens/accounts/AccountsScreen';
import { TransfersHistoryScreen } from '@/screens/accounts/TransfersHistoryScreen';
import type { AccountsStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AccountsStackParamList>();

export function AccountsStack() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const screenOptions = useMemo(() => ({
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text },
  }), [colors]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AccountsMain" component={AccountsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="TransfersHistory" component={TransfersHistoryScreen} options={{ title: t('nav.transfers') }} />
    </Stack.Navigator>
  );
}
