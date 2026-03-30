import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { AuthScreenProps } from '@/types/navigation';

export function WelcomeScreen({ navigation }: AuthScreenProps<'Welcome'>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>OhrangeFund</Text>
      <Text style={styles.subtitle}>Gestão financeira pessoal</Text>
      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.primaryButtonText}>Entrar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.secondaryButtonText}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
  },
  primaryButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: '600',
  },
});
