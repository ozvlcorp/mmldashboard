/**
 * RFM анализ — сегментация клиентов по трём метрикам:
 *   R (Recency)   — насколько недавно была покупка (меньше дней = лучше)
 *   F (Frequency) — сколько покупок сделал клиент
 *   M (Monetary)  — суммарная выручка от клиента
 *
 * Каждой метрике присваивается балл 1–5 по квинтилям.
 * Итоговый код — RFM (например, 555 = VIP, 111 = потерянные).
 */

export type RfmTransaction = {
  customerId: string;
  customerName?: string;
  date: string | Date;
  amount: number;
};

export type RfmCustomer = {
  id: string;
  name: string;
  recencyDays: number;  // дни с последней покупки
  frequency: number;    // число покупок
  monetary: number;     // суммарная выручка
};

export type RfmScored = RfmCustomer & {
  rScore: number; // 1..5 (5 = недавно покупал)
  fScore: number; // 1..5 (5 = много покупок)
  mScore: number; // 1..5 (5 = большой чек)
  rfm: string;    // "555"
  segment: RfmSegment;
};

export type RfmSegment =
  | 'Champions'         // VIP: 555, 554, 544, 545
  | 'Loyal'             // лояльные
  | 'Potential Loyal'   // потенциально лояльные
  | 'New'               // новые
  | 'Promising'         // перспективные
  | 'Need Attention'    // требуют внимания
  | 'At Risk'           // в зоне риска
  | 'Hibernating'       // спящие
  | 'Lost';             // потерянные

export type RfmOptions = {
  referenceDate?: Date; // дата отсчёта recency (по умолчанию сегодня)
};

export function aggregateTransactions(
  txs: RfmTransaction[],
  refDate: Date,
): RfmCustomer[] {
  const map = new Map<string, RfmCustomer>();
  for (const t of txs) {
    const id = t.customerId;
    const d = t.date instanceof Date ? t.date : new Date(t.date);
    if (!Number.isFinite(d.getTime())) continue;
    const ageMs = refDate.getTime() - d.getTime();
    const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
    const prev = map.get(id);
    if (!prev) {
      map.set(id, {
        id,
        name: t.customerName ?? id,
        recencyDays: ageDays,
        frequency: 1,
        monetary: t.amount,
      });
    } else {
      prev.recencyDays = Math.min(prev.recencyDays, ageDays);
      prev.frequency += 1;
      prev.monetary += t.amount;
      if (t.customerName) prev.name = t.customerName;
    }
  }
  return [...map.values()];
}

function quintileScore(value: number, sortedAsc: number[], invert = false): number {
  if (sortedAsc.length === 0) return 1;
  if (sortedAsc.length < 5) {
    const m = Math.max(...sortedAsc);
    const min = Math.min(...sortedAsc);
    if (m === min) return 3;
    const ratio = (value - min) / (m - min);
    const s = Math.min(5, Math.max(1, Math.ceil(ratio * 5)));
    return invert ? 6 - s : s;
  }
  const n = sortedAsc.length;
  const idx = sortedAsc.findIndex((v) => v >= value);
  const rank = idx === -1 ? n : idx + 1;
  const q = Math.min(5, Math.max(1, Math.ceil((rank / n) * 5)));
  return invert ? 6 - q : q;
}

export function scoreCustomers(customers: RfmCustomer[]): RfmScored[] {
  if (customers.length === 0) return [];
  const rSorted = [...customers].map((c) => c.recencyDays).sort((a, b) => a - b);
  const fSorted = [...customers].map((c) => c.frequency).sort((a, b) => a - b);
  const mSorted = [...customers].map((c) => c.monetary).sort((a, b) => a - b);

  return customers.map((c) => {
    // Recency меньше = лучше, поэтому инвертируем
    const rScore = quintileScore(c.recencyDays, rSorted, true);
    const fScore = quintileScore(c.frequency, fSorted);
    const mScore = quintileScore(c.monetary, mSorted);
    const rfm = `${rScore}${fScore}${mScore}`;
    return {
      ...c,
      rScore,
      fScore,
      mScore,
      rfm,
      segment: segmentOf(rScore, fScore, mScore),
    };
  });
}

function segmentOf(r: number, f: number, m: number): RfmSegment {
  const fm = (f + m) / 2;
  if (r >= 4 && fm >= 4) return 'Champions';
  if (r >= 3 && fm >= 3) return 'Loyal';
  if (r >= 4 && fm >= 2) return 'Potential Loyal';
  if (r === 5 && f === 1) return 'New';
  if (r >= 3 && fm <= 2) return 'Promising';
  if (r === 3 && fm >= 3) return 'Need Attention';
  if (r <= 2 && fm >= 3) return 'At Risk';
  if (r <= 2 && fm === 2) return 'Hibernating';
  return 'Lost';
}

export function buildRfmReport(
  txs: RfmTransaction[],
  opts: RfmOptions = {},
): RfmScored[] {
  const refDate = opts.referenceDate ?? new Date();
  const customers = aggregateTransactions(txs, refDate);
  return scoreCustomers(customers).sort((a, b) => b.monetary - a.monetary);
}

export function summarizeRfm(scored: RfmScored[]) {
  const segments = new Map<RfmSegment, { count: number; revenue: number }>();
  for (const s of scored) {
    const prev = segments.get(s.segment) ?? { count: 0, revenue: 0 };
    prev.count += 1;
    prev.revenue += s.monetary;
    segments.set(s.segment, prev);
  }
  return segments;
}
