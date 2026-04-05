import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BudgetsScreen } from '@/screens/budgets/BudgetsScreen';
import type { BudgetsStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<BudgetsStackParamList>();

export function BudgetsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BudgetsMain" component={BudgetsScreen} />
    </Stack.Navigator>
  );
}
