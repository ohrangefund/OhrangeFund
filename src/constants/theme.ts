export type ThemeMode = 'system' | 'dark' | 'light';

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textDisabled: string;
  primary: string;
  primaryForeground: string;
  error: string;
  success: string;
  income: string;
  expense: string;
}

export const darkColors: ColorTokens = {
  background: '#0F0F0F',
  surface: '#1C1C1C',
  surfaceAlt: '#252525',
  border: '#2E2E2E',
  text: '#F5F5F5',
  textSecondary: '#9CA3AF',
  textDisabled: '#4B5563',
  primary: '#F97316',
  primaryForeground: '#FFFFFF',
  error: '#EF4444',
  success: '#22C55E',
  income: '#22C55E',
  expense: '#EF4444',
};

export const lightColors: ColorTokens = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  primary: '#F97316',
  primaryForeground: '#FFFFFF',
  error: '#EF4444',
  success: '#22C55E',
  income: '#22C55E',
  expense: '#EF4444',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
