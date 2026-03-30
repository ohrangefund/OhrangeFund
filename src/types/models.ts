import { Timestamp } from 'firebase/firestore';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  balance: number; // cêntimos
  color: string;   // hex
  icon: string;    // nome do ícone Lucide
  archived: boolean;
  bank_account_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export const ACCOUNT_COLORS = [
  '#F97316', // laranja
  '#3B82F6', // azul
  '#22C55E', // verde
  '#EF4444', // vermelho
  '#8B5CF6', // roxo
  '#EC4899', // rosa
  '#F59E0B', // âmbar
  '#14B8A6', // teal
  '#64748B', // cinza
  '#84CC16', // lima
] as const;

export const ACCOUNT_ICONS = [
  'wallet',
  'credit-card',
  'landmark',
  'banknote',
  'piggy-bank',
  'briefcase',
  'home',
  'car',
  'shopping-bag',
  'globe',
] as const;

export type AccountIcon = typeof ACCOUNT_ICONS[number];
