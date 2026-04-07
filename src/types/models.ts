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
  is_shared?: boolean; // true = conta partilhada (aparece na screen Partilhadas)
  bank_account_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export const ACCOUNT_COLORS = [
  '#F97316', '#3B82F6', '#22C55E', '#EF4444', '#8B5CF6',
  '#EC4899', '#F59E0B', '#14B8A6', '#64748B', '#84CC16',
] as const;

export const ALL_COLORS = [
  '#F97316', '#3B82F6', '#22C55E', '#EF4444', '#8B5CF6',
  '#EC4899', '#F59E0B', '#14B8A6', '#64748B', '#84CC16',
  '#06B6D4', '#6366F1', '#EAB308', '#F43F5E', '#D946EF',
  '#0EA5E9', '#7C3AED', '#94A3B8', '#16A34A', '#1D4ED8',
  '#DC2626', '#9333EA', '#F87171', '#86EFAC', '#93C5FD',
  '#C4B5FD', '#FCD34D', '#6EE7B7', '#A78BFA', '#FB923C',
] as const;

export const ACCOUNT_ICONS = [
  'wallet', 'credit-card', 'landmark', 'banknote', 'piggy-bank',
  'briefcase', 'home', 'car', 'shopping-bag', 'globe',
] as const;

export const ALL_ICONS = [
  'wallet', 'credit-card', 'landmark', 'banknote', 'piggy-bank',
  'trending-up', 'trending-down', 'dollar-sign', 'receipt', 'bar-chart-2',
  'percent', 'coins', 'calculator',
  'shopping-cart', 'utensils', 'coffee', 'pizza', 'apple', 'beer', 'wine',
  'car', 'bus', 'bike', 'plane', 'train', 'fuel', 'ship', 'truck', 'map-pin',
  'home', 'tv', 'wrench', 'hammer', 'package',
  'heart', 'heart-pulse', 'activity', 'pill', 'baby', 'smile',
  'shopping-bag', 'shirt', 'tag', 'watch', 'gem', 'star',
  'music', 'film', 'gamepad-2', 'headphones', 'camera',
  'graduation-cap', 'book-open', 'pen', 'briefcase', 'building', 'laptop',
  'dumbbell', 'globe', 'sun', 'moon', 'zap', 'gift', 'leaf', 'droplets', 'flame',
  'wifi', 'smartphone', 'bell',
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

// ─── Investments ──────────────────────────────────────────────────────────────

export interface InvestmentAccount {
  id: string;
  user_id: string;
  created_at: Timestamp;
}

export type AssetType = 'etf' | 'stock' | 'crypto';

export interface SupportedAsset {
  ticker: string;
  name: string;
  type: AssetType;
}

export const SUPPORTED_ASSETS: SupportedAsset[] = [
  // ETFs
  { ticker: 'VWCE', name: 'Vanguard FTSE All-World', type: 'etf' },
  { ticker: 'CSPX', name: 'iShares Core S&P 500', type: 'etf' },
  { ticker: 'IWDA', name: 'iShares Core MSCI World', type: 'etf' },
  { ticker: 'VUSA', name: 'Vanguard S&P 500', type: 'etf' },
  { ticker: 'EIMI', name: 'iShares Core MSCI EM IMI', type: 'etf' },
  // Stocks
  { ticker: 'AAPL', name: 'Apple', type: 'stock' },
  { ticker: 'TSLA', name: 'Tesla', type: 'stock' },
  { ticker: 'MSFT', name: 'Microsoft', type: 'stock' },
  { ticker: 'NVDA', name: 'NVIDIA', type: 'stock' },
  { ticker: 'AMZN', name: 'Amazon', type: 'stock' },
  { ticker: 'GOOGL', name: 'Alphabet (Google)', type: 'stock' },
  { ticker: 'META', name: 'Meta Platforms', type: 'stock' },
  // Crypto
  { ticker: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { ticker: 'ETH', name: 'Ethereum', type: 'crypto' },
  { ticker: 'SOL', name: 'Solana', type: 'crypto' },
];

export interface InvestmentAsset {
  id: string;
  user_id: string;
  investment_account_id: string;
  ticker: string;
  name: string;
  type: AssetType;
  quantity: number;     // unidades acumuladas (decimal, ex: 6.5)
  created_at: Timestamp;
}

export interface InvestmentTransaction {
  id: string;
  user_id: string;
  investment_account_id: string;
  asset_id: string;
  account_id: string;       // conta regular debitada (buy) ou creditada (sell)
  type: 'buy' | 'sell';
  amount: number;           // valor em cêntimos, sempre positivo
  quantity: number;         // unidades transacionadas, sempre positivo
  price_per_unit: number;   // preço unitário no momento (cêntimos)
  description: string | null;
  date: Timestamp;
  created_at: Timestamp;
}

export interface InvestmentSnapshot {
  id: string;
  user_id: string;
  investment_account_id: string;
  total_value: number;      // valor total do portfolio em cêntimos
  trigger: 'buy' | 'sell' | 'cron';
  captured_at: Timestamp;
}

// ─── Account sharing ──────────────────────────────────────────────────────────

export interface AccountMember {
  id: string;           // compound: `{accountId}_{userId}`
  account_id: string;
  account_name?: string; // stored at invite time for display
  user_id: string;      // invited member's UID
  owner_id: string;     // account owner's UID
  owner_email?: string; // stored at invite time for display
  invitee_email: string; // stored for display
  permission?: 'read' | 'write'; // deprecated — all members have full access
  status: 'pending' | 'accepted';
  created_at: Timestamp;
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount_limit: number;  // cêntimos por mês
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface ScheduledInvestmentTransaction {
  id: string;
  user_id: string;
  investment_account_id: string;
  asset_id: string;
  account_id: string;       // conta regular a debitar (buy) ou creditar (sell)
  type: 'buy' | 'sell';
  amount: number;           // valor em cêntimos
  recurrence: Recurrence;
  next_date: Timestamp;
  end_date: Timestamp | null;
  description: string | null;
  created_at: Timestamp;
}
