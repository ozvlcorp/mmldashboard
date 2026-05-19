import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = {
  money(n: number | null | undefined, currency = '') {
    if (n == null || !Number.isFinite(n)) return '—';
    const sign = n < 0 ? '−' : '';
    const abs = Math.abs(n);
    const s = abs.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
    return `${sign}${s}${currency ? ' ' + currency : ''}`;
  },
  num(n: number | null | undefined, digits = 1) {
    if (n == null || !Number.isFinite(n)) return '—';
    return n.toLocaleString('ru-RU', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  },
  pct(n: number | null | undefined, digits = 1) {
    if (n == null || !Number.isFinite(n)) return '—';
    return (
      (n * 100).toLocaleString('ru-RU', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }) + '%'
    );
  },
  int(n: number | null | undefined) {
    if (n == null || !Number.isFinite(n)) return '—';
    return Math.round(n).toLocaleString('ru-RU');
  },
  days(n: number | null | undefined) {
    if (n == null || !Number.isFinite(n)) return '—';
    return n.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' дн';
  },
};

export function sum(arr: number[]): number {
  let s = 0;
  for (const v of arr) if (Number.isFinite(v)) s += v;
  return s;
}

export function mean(arr: number[]): number {
  const xs = arr.filter(Number.isFinite);
  if (!xs.length) return 0;
  return sum(xs) / xs.length;
}

export function stddev(arr: number[]): number {
  const xs = arr.filter(Number.isFinite);
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}
