import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { CategoriesScreen } from '@/screens/settings/CategoriesScreen';
import type { SettingsStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export function SettingsStack() {
  const { colors } = useTheme();

  const screenOptions = useMemo(() => ({
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.text,
    headerTitleStyle: { color: colors.text },
  }), [colors]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Definições' }} />
      <Stack.Screen name="Categories" component={CategoriesScreen} options={{ title: 'Categorias' }} />
    </Stack.Navigator>
  );
}
