import { Timestamp } from 'firebase/firestore';
import i18n from '@/i18n';

export function formatDate(date: Timestamp | Date): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const locale = i18n.language === 'pt' ? 'pt-PT' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

export function parseDate(value: string): Date | null {
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year || year < 1900) return null;
  const d = new Date(year, month - 1, day);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function formatRelativeDate(date: Timestamp | Date): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return i18n.t('common.today');
  if (days === 1) return i18n.t('common.yesterday');
  if (days < 7) return i18n.t('common.daysAgo', { count: days });
  return formatDate(d);
}
