/**
 * Клиентский (браузерный) оркестратор загрузки МойСклад.
 * Делает несколько коротких запросов через /api/moysklad/page вместо одного
 * толстого — чтобы вписаться в 10-секундный лимит Netlify Functions.
 */

import {
  assortmentToInventory,
  demandsToAbc,
  demandsToRfm,
  demandsToXyz,
} from './transform';
import type { InventoryInput } from '../analytics/inventory';
import type { AbcInput } from '../analytics/abc';
import type { XyzInput } from '../analytics/xyz';
import type { RfmTransaction } from '../analytics/rfm';
import type {
  MsAssortmentItem,
  MsCounterparty,
  MsCounterpartyReport,
  MsDemand,
  MsListResponse,
} from './types';
import type { DebtCandidate } from './debts';

export type ConnectParams = {
  periodDays: number;
  normDays: number;
  normDaysAttribute?: string;
  priceTypeName?: string;
};

export type AnalyticsResult = {
  inventory: InventoryInput[];
  abc: AbcInput[];
  xyz: XyzInput[];
  rfm: RfmTransaction[];
  meta: {
    periodDays: number;
    from: string;
    to: string;
    productsCount: number;
    demandsCount: number;
    turnover: number; // суммарная выручка за период в сумах (demand.sum / 100)
  };
};

export type ComparisonResult = {
  previousFrom: string;
  previousTo: string;
  previousDemandsCount: number;
  previousTurnover: number;
};

export type LoadProgress =
  | { stage: 'assortment'; count: number }
  | { stage: 'demands'; count: number }
  | { stage: 'compute' };

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function msMoment(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function fetchPage<T>(token: string, path: string): Promise<MsListResponse<T>> {
  const res = await fetch('/api/moysklad/page', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, path }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.error || `HTTP ${res.status}`);
  }
  return data as MsListResponse<T>;
}

/**
 * Параллельная выборка списка через offset/limit. После первой страницы
 * знаем `meta.size` → расчитываем все остальные offset'ы и стреляем
 * их одновременно. Cap на 5 одновременных запросов чтобы не упереться
 * в rate limit МойСклад (типично 5 rps).
 */
async function fetchAllParallel<T>(
  token: string,
  basePath: string, // без limit/offset
  limit: number,
  onCount: (n: number) => void,
): Promise<T[]> {
  const sep = basePath.includes('?') ? '&' : '?';
  const makeUrl = (offset: number) => `${basePath}${sep}limit=${limit}&offset=${offset}`;

  const first = await fetchPage<T>(token, makeUrl(0));
  const out: T[] = [...first.rows];
  onCount(out.length);

  const total = first.meta?.size ?? first.rows.length;
  if (out.length >= total) return out;

  const offsets: number[] = [];
  for (let off = first.rows.length; off < total; off += limit) {
    offsets.push(off);
  }

  const pages: (T[] | undefined)[] = new Array(offsets.length);
  let nextIdx = 0;
  let loaded = out.length;
  const concurrency = Math.min(5, offsets.length);
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const idx = nextIdx++;
      if (idx >= offsets.length) break;
      const page = await fetchPage<T>(token, makeUrl(offsets[idx]));
      pages[idx] = page.rows;
      loaded += page.rows.length;
      onCount(loaded);
    }
  });
  await Promise.all(workers);

  for (const rows of pages) {
    if (rows) out.push(...rows);
  }
  return out;
}

export async function loadAnalytics(
  token: string,
  params: ConnectParams,
  onProgress?: (e: LoadProgress) => void,
): Promise<AnalyticsResult> {
  const until = new Date();
  const from = new Date(until.getTime() - params.periodDays * 86400000);

  // Ассортимент — маленькие записи, можно тащить большими страницами
  const assortment = await fetchAllParallel<MsAssortmentItem>(
    token,
    '/entity/assortment?stockStore.byStore=true',
    500,
    (n) => onProgress?.({ stage: 'assortment', count: n }),
  );

  // Отгрузки с expand жирнее — берём меньшими страницами
  const qp = new URLSearchParams({
    filter: `moment>=${msMoment(from)};moment<=${msMoment(until)}`,
    expand: 'positions.assortment,agent',
    order: 'moment,asc',
  });
  const demands = await fetchAllParallel<MsDemand>(
    token,
    `/entity/demand?${qp.toString()}`,
    100,
    (n) => onProgress?.({ stage: 'demands', count: n }),
  );

  onProgress?.({ stage: 'compute' });

  const inventory = assortmentToInventory(assortment, demands, {
    periodDays: params.periodDays,
    defaultNormDays: params.normDays,
    priceTypeName: params.priceTypeName,
    normDaysAttribute: params.normDaysAttribute,
  });
  const abc = demandsToAbc(demands);
  const xyz = demandsToXyz(demands, {
    bucketDays: 7,
    periodsCount: 8,
    until,
  });
  const rfm = demandsToRfm(demands);

  const turnover = demands.reduce((s, d) => s + (d.sum ?? 0), 0) / 100;

  return {
    inventory,
    abc,
    xyz,
    rfm,
    meta: {
      periodDays: params.periodDays,
      from: from.toISOString(),
      to: until.toISOString(),
      productsCount: assortment.length,
      demandsCount: demands.length,
      turnover,
    },
  };
}

/**
 * Лёгкий запрос предыдущего периода — только агрегаты (без expand),
 * чтобы посчитать period-over-period дельту для KPI.
 */
export async function loadComparison(
  token: string,
  params: ConnectParams,
  onProgress?: (n: number) => void,
): Promise<ComparisonResult> {
  const now = new Date();
  const currentFrom = new Date(now.getTime() - params.periodDays * 86400000);
  const previousTo = new Date(currentFrom.getTime() - 1000); // на секунду раньше старта current
  const previousFrom = new Date(previousTo.getTime() - params.periodDays * 86400000);

  const qp = new URLSearchParams({
    filter: `moment>=${msMoment(previousFrom)};moment<=${msMoment(previousTo)}`,
    order: 'moment,asc',
  });
  // Без expand — записи маленькие, можно тащить большими страницами
  const demands = await fetchAllParallel<MsDemand>(
    token,
    `/entity/demand?${qp.toString()}`,
    500,
    onProgress ?? (() => {}),
  );

  const previousTurnover = demands.reduce((s, d) => s + (d.sum ?? 0), 0) / 100;
  return {
    previousFrom: previousFrom.toISOString(),
    previousTo: previousTo.toISOString(),
    previousDemandsCount: demands.length,
    previousTurnover,
  };
}

export type DebtorsProgress =
  | { stage: 'reports'; count: number }
  | { stage: 'cards'; done: number; total: number };

const UUID_RE = /([0-9a-f-]{36})(?:$|[/?])/i;

function extractUuid(href: string | undefined): string | null {
  if (!href) return null;
  return UUID_RE.exec(href)?.[1] ?? null;
}

async function fetchEntity<T>(token: string, path: string): Promise<T | null> {
  try {
    const res = await fetch('/api/moysklad/page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, path }),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return data as T;
  } catch {
    return null;
  }
}

/**
 * Текущий пользователь, которому принадлежит токен. Используется как
 * assignee по умолчанию для создаваемых задач.
 */
export async function loadCurrentEmployee(
  token: string,
): Promise<{ href: string; name: string } | null> {
  const emp = await fetchEntity<{ name?: string; meta?: { href?: string } }>(
    token,
    '/context/employee',
  );
  if (!emp?.meta?.href) return null;
  return { href: emp.meta.href, name: emp.name ?? 'Текущий пользователь' };
}

/**
 * Создаёт задачу в МойСклад для одного должника.
 */
export async function createDebtorTask(
  token: string,
  debtor: import('./debts').DebtCandidate,
  assigneeHref: string,
  telegramWebhookBase?: string,
): Promise<{ taskId: string }> {
  const res = await fetch('/api/moysklad/debts/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      debtors: [debtor],
      assigneeHref,
      telegramWebhookBase,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`);
  const result = data.results?.[0];
  if (!result?.ok) {
    throw new Error(result?.error ?? 'Task creation failed');
  }
  return { taskId: result.taskId };
}

async function fetchCounterpartiesBatch(
  token: string,
  ids: string[],
  onProgress: (done: number, total: number) => void,
): Promise<Map<string, MsCounterparty>> {
  const map = new Map<string, MsCounterparty>();
  if (ids.length === 0) return map;
  const BATCH = 50;
  let done = 0;

  // Несколько батчей параллельно
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    batches.push(ids.slice(i, i + BATCH));
  }

  let nextIdx = 0;
  const concurrency = Math.min(5, batches.length);
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const idx = nextIdx++;
      if (idx >= batches.length) break;
      const chunk = batches[idx];
      const filter = chunk.map((id) => `id=${id}`).join(';'); // OR в МойСклад
      const path = `/entity/counterparty?filter=${encodeURIComponent(filter)}&limit=${chunk.length}`;
      const page = await fetchPage<MsCounterparty>(token, path);
      for (const cp of page.rows) {
        map.set(cp.id, cp);
      }
      done += chunk.length;
      onProgress(done, ids.length);
    }
  });
  await Promise.all(workers);
  return map;
}

/**
 * Все контрагенты с отрицательным балансом. Не зависит от кастомных
 * атрибутов МойСклад — работает на любом аккаунте сразу.
 */
export async function loadDebtors(
  token: string,
  onProgress?: (e: DebtorsProgress) => void,
): Promise<DebtCandidate[]> {
  const reports = await fetchAllParallel<MsCounterpartyReport>(
    token,
    '/report/counterparty',
    500,
    (n) => onProgress?.({ stage: 'reports', count: n }),
  );
  const debtors = reports.filter((r) => r.balance < 0);
  if (debtors.length === 0) return [];

  const ids = debtors
    .map((r) => extractUuid(r.counterparty?.meta?.href))
    .filter((id): id is string => !!id);

  const cards = await fetchCounterpartiesBatch(token, ids, (done, total) =>
    onProgress?.({ stage: 'cards', done, total }),
  );

  const out: DebtCandidate[] = debtors.map((r) => {
    const cpId = extractUuid(r.counterparty?.meta?.href) ?? '';
    const cp = cards.get(cpId);
    return {
      demandId: cpId,
      demandName: r.demandsCount ? `${r.demandsCount} отгрузок` : '—',
      demandMoment: r.lastDemandDate ?? new Date().toISOString(),
      demandSum: (r.demandsSum ?? 0) / 100,
      counterpartyId: cpId,
      counterpartyName: cp?.name ?? `Контрагент ${cpId.slice(0, 8)}`,
      counterpartyPhone: cp?.phone,
      balance: r.balance / 100,
      debtAmount: Math.abs(r.balance) / 100,
    };
  });
  return out.sort((a, b) => b.debtAmount - a.debtAmount);
}
