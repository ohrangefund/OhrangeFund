import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { app } from '@/api/firebase';

export default function App() {
  const [status, setStatus] = useState('A inicializar Firebase...');

  useEffect(() => {
    try {
      const projectId = app.options.projectId;
      setStatus(`Firebase OK\nProject: ${projectId}`);
    } catch (e: any) {
      setStatus(`Erro: ${e.message}`);
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    fontSize: 16,
  },
});
