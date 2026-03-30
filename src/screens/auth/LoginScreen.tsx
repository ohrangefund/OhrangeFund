import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/api/firebase';
import { useTheme } from '@/context/ThemeContext';
import type { AuthScreenProps } from '@/types/navigation';

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email ou password incorretos.';
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/too-many-requests':
      return 'Demasiadas tentativas. Tenta mais tarde.';
    default:
      return 'Erro ao entrar. Tenta novamente.';
  }
}

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError('Preenche todos os campos.'); return; }
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      setError(getErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Entrar</Text>

      {error ? <Text style={[styles.error, { color: colors.error }]}>{error}</Text> : null}

      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.primaryForeground} />
          : <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Entrar</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={[styles.link, { color: colors.textSecondary }]}>
          Ainda não tens conta? <Text style={{ color: colors.primary, fontWeight: '600' }}>Regista-te</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  error: { marginBottom: 12, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', fontSize: 14 },
});
