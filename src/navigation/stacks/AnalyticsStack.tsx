import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { AnalyticsScreen } from '@/screens/analytics/AnalyticsScreen';
import type { AnalyticsStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

export function AnalyticsStack() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="AnalyticsMain"
        component={AnalyticsScreen}
        options={{ title: t('nav.analytics') }}
      />
    </Stack.Navigator>
  );
}
