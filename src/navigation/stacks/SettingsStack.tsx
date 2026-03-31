import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { VisualsScreen } from '@/screens/settings/VisualsScreen';
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
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Visuals" component={VisualsScreen} options={{ title: 'Visuais' }} />
    </Stack.Navigator>
  );
}
