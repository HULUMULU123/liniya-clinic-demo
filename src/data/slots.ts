// Условные окна записи: занятость детерминирована по дате, при каждом открытии одинакова.
export const HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function nextDays(n = 7, from = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => { const d = new Date(from); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + i); return d; });
}
export function isBusy(day: Date, hour: number, now = new Date()): boolean {
  const today = iso(day) === iso(now);
  if (today && hour <= now.getHours()) return true;
  return hash(`${iso(day)}-${hour}`) < 0.32;
}
