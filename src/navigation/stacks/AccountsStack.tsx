import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { AccountsScreen } from '@/screens/accounts/AccountsScreen';
import { AccountDetailScreen } from '@/screens/home/AccountDetailScreen';
import { TransfersHistoryScreen } from '@/screens/accounts/TransfersHistoryScreen';
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
      <Stack.Screen name="AccountsMain" component={AccountsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="AccountDetail"
        component={AccountDetailScreen}
        options={({ route }) => ({
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: route.params.accountColor }} />
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>
                {route.params.accountName}
              </Text>
            </View>
          ),
        })}
      />
      <Stack.Screen name="TransfersHistory" component={TransfersHistoryScreen} options={{ title: 'Transferências' }} />
    </Stack.Navigator>
  );
}
