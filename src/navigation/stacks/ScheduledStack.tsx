import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ScheduledScreen } from '@/screens/scheduled/ScheduledScreen';
import type { ScheduledStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<ScheduledStackParamList>();

export function ScheduledStack() {
  const { colors } = useTheme();
  const { t } = useTranslation();

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
        options={{ title: t('nav.scheduled') }}
      />
    </Stack.Navigator>
  );
}
