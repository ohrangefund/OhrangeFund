import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { InvestmentScreen } from '@/screens/investments/InvestmentScreen';
import type { InvestmentsStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<InvestmentsStackParamList>();

export function InvestmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InvestmentsMain" component={InvestmentScreen} />
    </Stack.Navigator>
  );
}
