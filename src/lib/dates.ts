const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Formats a date as "YYYY-MM-DD" in the user's local timezone (not UTC). */
export function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole days from today (local midnight) until a "YYYY-MM-DD" exam date. 0 = today, negative = passed. */
export function daysUntil(isoDate: string): number {
  const [y, m, d] = isoDate.split('T')[0].split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}
