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
  background: '#1A1A1A',
  surface: '#252525',
  surfaceAlt: '#2E2E2E',
  border: '#3A3A3A',
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
  background: '#E8E8E8',
  surface: '#F2F2F2',
  surfaceAlt: '#E0E0E0',
  border: '#C8C8C8',
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
