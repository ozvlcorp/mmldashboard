/**
 * XYZ анализ — классификация по стабильности спроса (коэффициент вариации).
 *
 * Принимает массив периодных продаж по каждому SKU.
 * Класс X — CV ≤ 10% (стабильный спрос, можно работать "точно в срок").
 * Класс Y — CV 10–25% (сезонный/умеренно колеблющийся).
 * Класс Z — CV > 25% (нерегулярный, страховой запас обязателен).
 */

import { mean, stddev } from '../utils';

export type XyzInput = {
  id: string;
  name: string;
  periods: number[]; // продажи по периодам (дни/недели/месяцы)
};

export type XyzClass = 'X' | 'Y' | 'Z';

export type XyzRow = {
  id: string;
  name: string;
  mean: number;
  stddev: number;
  cv: number; // коэффициент вариации (0..∞)
  class: XyzClass;
  totalSales: number;
  periodsCount: number;
};

export type XyzOptions = {
  thresholds?: { x: number; y: number }; // по умолчанию x=0.10, y=0.25
};

export function buildXyzReport(inputs: XyzInput[], opts: XyzOptions = {}): XyzRow[] {
  const xT = opts.thresholds?.x ?? 0.1;
  const yT = opts.thresholds?.y ?? 0.25;

  return inputs.map((r) => {
    const xs = r.periods.filter(Number.isFinite);
    const m = mean(xs);
    const sd = stddev(xs);
    const cv = m > 0 ? sd / m : Infinity;
    const cls: XyzClass = cv <= xT ? 'X' : cv <= yT ? 'Y' : 'Z';
    return {
      id: r.id,
      name: r.name,
      mean: m,
      stddev: sd,
      cv,
      class: cls,
      totalSales: xs.reduce((s, x) => s + x, 0),
      periodsCount: xs.length,
    };
  });
}

/**
 * Совмещение ABC × XYZ — даёт матрицу 9 категорий.
 * AX — флагман (стабильно и прибыльно), CZ — кандидаты на вывод из ассортимента.
 */
export type AbcXyzCell = `${'A' | 'B' | 'C'}${'X' | 'Y' | 'Z'}`;

export function combineAbcXyz(
  abc: Array<{ id: string; class: 'A' | 'B' | 'C' }>,
  xyz: Array<{ id: string; class: 'X' | 'Y' | 'Z' }>,
): Map<string, AbcXyzCell> {
  const xyzMap = new Map(xyz.map((x) => [x.id, x.class]));
  const result = new Map<string, AbcXyzCell>();
  for (const a of abc) {
    const xClass = xyzMap.get(a.id);
    if (xClass) result.set(a.id, `${a.class}${xClass}` as AbcXyzCell);
  }
  return result;
}
