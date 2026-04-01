import { Timestamp } from 'firebase/firestore';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  balance: number; // cêntimos
  color: string;   // hex
  icon: string;    // nome do ícone Lucide
  archived: boolean;
  show_in_general: boolean;
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

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  is_default: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export const CATEGORY_COLORS = ACCOUNT_COLORS;

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  type: 'income' | 'expense';
  amount: number;       // cêntimos, sempre positivo
  description: string;
  date: Timestamp;
  source: 'manual' | 'bank';
  external_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Transfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  account_ids: string[]; // [from, to] — para queries array-contains
  amount: number;        // cêntimos, sempre positivo
  description: string;
  date: Timestamp;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export const CATEGORY_ICONS = [
  'shopping-cart', 'utensils', 'car', 'home', 'heart-pulse',
  'graduation-cap', 'zap', 'plane', 'coffee', 'briefcase',
  'trending-up', 'trending-down', 'gift', 'piggy-bank', 'banknote', 'wallet',
  'dumbbell', 'shirt', 'music',
] as const;

export type Recurrence = 'once' | 'weekly' | 'monthly' | 'yearly';

export interface ScheduledTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string;
  amount: number;       // cêntimos, sempre positivo
  type: 'income' | 'expense';
  description: string | null;
  recurrence: Recurrence;
  next_date: Timestamp;
  end_date: Timestamp | null;
  created_at: Timestamp;
}

export interface ScheduledTransfer {
  id: string;
  user_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;       // cêntimos, sempre positivo
  description: string | null;
  recurrence: Recurrence;
  next_date: Timestamp;
  end_date: Timestamp | null;
  created_at: Timestamp;
}
