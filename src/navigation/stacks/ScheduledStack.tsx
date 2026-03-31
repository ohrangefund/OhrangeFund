import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/context/ThemeContext';
import { ScheduledScreen } from '@/screens/scheduled/ScheduledScreen';
import type { ScheduledStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<ScheduledStackParamList>();

export function ScheduledStack() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="ScheduledMain"
        component={ScheduledScreen}
        options={{ title: 'Agendamentos' }}
      />
    </Stack.Navigator>
  );
}
