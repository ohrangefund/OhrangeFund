import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/api/firebase';
import { useTheme } from '@/context/ThemeContext';
import type { AuthScreenProps } from '@/types/navigation';

function getErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este email já está registado.';
    case 'auth/invalid-email':
      return 'Email inválido.';
    case 'auth/weak-password':
      return 'A password deve ter pelo menos 6 caracteres.';
    default:
      return 'Erro ao criar conta. Tenta novamente.';
  }
}

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password) { setError('Preenche todos os campos.'); return; }
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        display_name: '',
        theme: 'dark',
        created_at: serverTimestamp(),
      });
    } catch (e: any) {
      setError(getErrorMessage(e.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Criar conta</Text>

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
        placeholder="Password (mínimo 6 caracteres)"
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={colors.primaryForeground} />
          : <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Criar conta</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={[styles.link, { color: colors.textSecondary }]}>
          Já tens conta? <Text style={{ color: colors.primary, fontWeight: '600' }}>Entra</Text>
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
