/**
 * ABC анализ — классификация позиций по их вкладу в кумулятивную метрику.
 * Метрикой обычно служит выручка или маржа, но можно подать любую (профит, количество).
 *
 * Класс A — позиции, дающие первые ~80% (по умолчанию).
 * Класс B — следующие ~15%.
 * Класс C — оставшиеся ~5%.
 */

export type AbcInput = {
  id: string;
  name: string;
  value: number; // метрика (выручка / маржа / штук)
};

export type AbcClass = 'A' | 'B' | 'C';

export type AbcRow = AbcInput & {
  share: number;       // доля от общей метрики
  cumShare: number;    // кумулятивная доля
  rank: number;
  class: AbcClass;
};

export type AbcOptions = {
  thresholds?: { a: number; b: number }; // по умолчанию a=0.8, b=0.95
};

export function buildAbcReport(inputs: AbcInput[], opts: AbcOptions = {}): AbcRow[] {
  const aT = opts.thresholds?.a ?? 0.8;
  const bT = opts.thresholds?.b ?? 0.95;

  const sorted = [...inputs]
    .filter((x) => Number.isFinite(x.value))
    .sort((a, b) => b.value - a.value);

  const total = sorted.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) {
    return sorted.map((r, i) => ({
      ...r,
      share: 0,
      cumShare: 0,
      rank: i + 1,
      class: 'C' as AbcClass,
    }));
  }

  let cum = 0;
  return sorted.map((r, i) => {
    const share = Math.max(0, r.value) / total;
    cum += share;
    const cls: AbcClass = cum <= aT ? 'A' : cum <= bT ? 'B' : 'C';
    return {
      ...r,
      share,
      cumShare: cum,
      rank: i + 1,
      class: cls,
    };
  });
}

export function summarizeAbc(rows: AbcRow[]) {
  const groups: Record<AbcClass, { count: number; value: number; share: number }> = {
    A: { count: 0, value: 0, share: 0 },
    B: { count: 0, value: 0, share: 0 },
    C: { count: 0, value: 0, share: 0 },
  };
  for (const r of rows) {
    groups[r.class].count += 1;
    groups[r.class].value += r.value;
    groups[r.class].share += r.share;
  }
  return groups;
}
