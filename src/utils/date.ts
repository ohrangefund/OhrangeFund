import { Timestamp } from 'firebase/firestore';

export function formatDate(date: Timestamp | Date): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
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

  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `Há ${days} dias`;
  return formatDate(d);
}
