import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/api/firebase';
import { useAuth } from '@/context/AuthContext';
import { darkColors, lightColors, type ColorTokens, type ThemeMode } from '@/constants/theme';

const THEME_KEY = '@ohrangefund/theme';

interface ThemeContextValue {
  colors: ColorTokens;
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: darkColors,
  theme: 'dark',
  isDark: true,
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setThemeState(stored);
      }
    });
  }, []);

  async function setTheme(mode: ThemeMode) {
    setThemeState(mode);
    await AsyncStorage.setItem(THEME_KEY, mode);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { theme: mode });
    }
  }

  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
