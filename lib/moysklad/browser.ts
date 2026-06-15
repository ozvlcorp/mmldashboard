/**
 * Клиентский (браузерный) оркестратор загрузки МойСклад.
 * Делает несколько коротких запросов через /api/moysklad/page вместо одного
 * толстого — чтобы вписаться в 10-секундный лимит Netlify Functions.
 */

import {
  assortmentToInventory,
  demandsToAbc,
  demandsToRfm,
  mapMsStatusToSegment,
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
  /** Явный диапазон дат (YYYY-MM-DD). Если задан — имеет приоритет над periodDays. */
  fromDate?: string;
  toDate?: string;
};

/** Вычисляет окно [from, until] из params: явные даты в приоритете. */
function resolveWindow(params: ConnectParams): { from: Date; until: Date; periodDays: number } {
  if (params.fromDate && params.toDate) {
    const from = new Date(params.fromDate + 'T00:00:00');
    const until = new Date(params.toDate + 'T23:59:59');
    if (Number.isFinite(from.getTime()) && Number.isFinite(until.getTime()) && from <= until) {
      const days = Math.max(1, Math.round((until.getTime() - from.getTime()) / 86400000));
      return { from, until, periodDays: days };
    }
  }
  const until = new Date();
  const from = new Date(until.getTime() - params.periodDays * 86400000);
  return { from, until, periodDays: params.periodDays };
}

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
    turnover: number; // суммарная выручка за период в базовой валюте (demand.sum / 100)
    /** Символ базовой валюты аккаунта (например "сум"). Источник истины для UI. */
    currency?: string;
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
  const { from, until, periodDays } = resolveWindow(params);

  // Ассортимент — маленькие записи, можно тащить большими страницами
  const assortment = await fetchAllParallel<MsAssortmentItem>(
    token,
    '/entity/assortment?stockStore.byStore=true',
    500,
    (n) => onProgress?.({ stage: 'assortment', count: n }),
  );

  // Продажи: тянем И обычные отгрузки (опт, b2b), И розничные продажи
  // (касса МойСклад). У некоторых клиентов вся выручка идёт через
  // /entity/retaildemand — без этого endpoint'а аналитика была бы пустой.
  // Оба эндпоинта возвращают идентичную для нас структуру (positions,
  // sum, agent, rate.currency), поэтому дальше обрабатываются единообразно.
  const qp = new URLSearchParams({
    filter: `moment>=${msMoment(from)};moment<=${msMoment(until)}`,
    expand: 'positions.assortment,agent,rate.currency',
    order: 'moment,asc',
  });
  let wholesale = 0;
  let retail = 0;
  const [demandsWholesale, demandsRetail] = await Promise.all([
    fetchAllParallel<MsDemand>(
      token,
      `/entity/demand?${qp.toString()}`,
      100,
      (n) => {
        wholesale = n;
        onProgress?.({ stage: 'demands', count: wholesale + retail });
      },
    ),
    fetchAllParallel<MsDemand>(
      token,
      `/entity/retaildemand?${qp.toString()}`,
      100,
      (n) => {
        retail = n;
        onProgress?.({ stage: 'demands', count: wholesale + retail });
      },
    ).catch(() => [] as MsDemand[]), // на аккаунтах без розницы endpoint может 404 — ок
  ]);
  const demands = [...demandsWholesale, ...demandsRetail];

  // Базовая валюта по мажоритарной валюте отгрузок (источник правды о
  // валюте учёта) + курсы для конвертации цен из карточек.
  const demandCurrencyId = pickMajorityCurrencyId(demands);
  const { base: baseCurrency, byId: currencyById } = await loadCurrencies(
    token,
    demandCurrencyId,
  );

  // Сегменты RFM из статусов контрагентов МойСклад. Если у клиента в МойСклад
  // выставлен статус («Чемпионы», «Лояльные» и т.д.), он перезаписывает
  // автоматический сегмент. Подтягиваем карточки только тех контрагентов,
  // которые встретились в отгрузках за период.
  const agentIds = new Set<string>();
  for (const d of demands) {
    const id = extractUuid(d.agent?.meta?.href);
    if (id) agentIds.add(id);
  }
  const customerSegmentByAgentId = await loadCustomerSegments(token, [...agentIds]);

  onProgress?.({ stage: 'compute' });

  const inventory = assortmentToInventory(assortment, demands, {
    periodDays,
    defaultNormDays: params.normDays,
    priceTypeName: params.priceTypeName,
    normDaysAttribute: params.normDaysAttribute,
    currencyById,
  });
  const abc = demandsToAbc(demands);
  const xyz = demandsToXyz(demands, {
    bucketDays: 7,
    periodsCount: 8,
    until,
  });
  const rfm = demandsToRfm(
    demands,
    customerSegmentByAgentId,
    currencyById,
    baseCurrency?.symbol,
  );

  // d.sum хранится в базовой валюте — конвертация не нужна.
  const turnover = demands.reduce((s, d) => s + (d.sum ?? 0), 0) / 100;

  return {
    inventory,
    abc,
    xyz,
    rfm,
    meta: {
      periodDays,
      from: from.toISOString(),
      to: until.toISOString(),
      productsCount: assortment.length,
      demandsCount: demands.length,
      turnover,
      currency: baseCurrency?.symbol,
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
  // Без expand — записи маленькие, можно тащить большими страницами.
  // Тянем И опт, И розницу (для розничных аккаунтов demand пуст).
  const [demandsW, demandsR] = await Promise.all([
    fetchAllParallel<MsDemand>(
      token,
      `/entity/demand?${qp.toString()}`,
      500,
      onProgress ?? (() => {}),
    ),
    fetchAllParallel<MsDemand>(
      token,
      `/entity/retaildemand?${qp.toString()}`,
      500,
      onProgress ?? (() => {}),
    ).catch(() => [] as MsDemand[]),
  ]);
  const demands = [...demandsW, ...demandsR];

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

export type CurrencyRate = {
  id: string;
  symbol: string;
  /** Множитель к базовой валюте: 1 ед. этой валюты = toBase базовых. */
  toBase: number;
};

/**
 * Загружает ВСЕ валюты аккаунта + базовую валюту из companysettings,
 * и строит:
 *  - base: валюта по умолчанию (берётся из companysettings — это
 *    единственный надёжный источник; флаг `default` в /entity/currency
 *    у некоторых аккаунтов отсутствует или указывает не на ту);
 *  - byId: id → { символ, множитель toBase } для конвертации цен из
 *    карточек товаров в базовую.
 *
 * Курс МойСклад: rate — это сколько единиц базовой валюты приходится
 * на multiplicity единиц данной валюты. То есть в UI «1 USD = 12 020
 * UZS» хранится как rate=12020, multiplicity=1, и формула toBase =
 * rate/multiplicity всегда даёт правильный коэффициент. Флаг inverse/
 * indirect в API не встречается стабильно — он управляет только
 * представлением в UI, на хранимое значение rate не влияет.
 */
/** Возвращает id валюты, в которой выписано большинство отгрузок. */
function pickMajorityCurrencyId(demands: MsDemand[]): string | null {
  const counts = new Map<string, number>();
  for (const d of demands) {
    const id = extractUuid(d.rate?.currency?.meta?.href);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [id, n] of counts) {
    if (n > bestN) {
      bestN = n;
      best = id;
    }
  }
  return best;
}

export async function loadCurrencies(
  token: string,
  preferredBaseId: string | null = null,
): Promise<{ base: CurrencyInfo | null; byId: Map<string, CurrencyRate> }> {
  const byId = new Map<string, CurrencyRate>();
  let base: CurrencyInfo | null = null;

  // Базовая валюта: 1) preferredBaseId (мажоритарная отгрузка — факт учёта)
  //                 2) companysettings.currency
  //                 3) default-флаг в /entity/currency
  let baseId: string | null = preferredBaseId;
  if (!baseId) {
    try {
      const settings = await fetchEntity<{ currency?: { meta?: { href?: string } } }>(
        token,
        '/context/companysettings',
      );
      const href = settings?.currency?.meta?.href;
      if (href) baseId = extractUuid(href);
    } catch {
      /* fallback пойдёт через флаг default */
    }
  }

  // Шаг 2: все валюты с курсами одним запросом.
  try {
    const page = await fetchPage<{
      id: string;
      name?: string;
      fullName?: string;
      isoCode?: string;
      rate?: number;
      multiplicity?: number;
      default?: boolean;
      isDefault?: boolean;
    }>(token, '/entity/currency?limit=1000');

    for (const row of page.rows) {
      const iso = (row.isoCode ?? '').toUpperCase();
      const symbol = CURRENCY_SYMBOLS[iso] || row.name || iso || '';
      const rate = typeof row.rate === 'number' && row.rate > 0 ? row.rate : 1;
      const mult =
        typeof row.multiplicity === 'number' && row.multiplicity > 0
          ? row.multiplicity
          : 1;
      // 1 ед. этой валюты = rate/multiplicity ед. базовой валюты аккаунта.
      const toBase = rate / mult;

      const isBase =
        (baseId && row.id === baseId) ||
        row.default === true ||
        row.isDefault === true;

      if (isBase) {
        base = {
          isoCode: iso,
          name: row.fullName || row.name || iso,
          symbol,
        };
        byId.set(row.id, { id: row.id, symbol, toBase: 1 });
      } else {
        byId.set(row.id, { id: row.id, symbol, toBase: toBase > 0 ? toBase : 1 });
      }
    }
  } catch {
    /* без валют сработают разумные дефолты */
  }
  return { base, byId };
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

const CURRENCY_SYMBOLS: Record<string, string> = {
  UZS: 'сум',
  RUB: '₽',
  USD: '$',
  EUR: '€',
  KZT: '₸',
  KGS: 'сом',
  TJS: 'смн',
  BYN: 'Br',
  UAH: '₴',
  TRY: '₺',
  AZN: '₼',
  GBP: '£',
};

export type CurrencyInfo = {
  isoCode: string;
  name: string;
  symbol: string;
};

/**
 * Базовая валюта аккаунта МойСклад. Тянем через companysettings →
 * /entity/currency/{id}, выбираем символ или сокращение для UI.
 */
export async function loadCompanyCurrency(
  token: string,
): Promise<CurrencyInfo | null> {
  const settings = await fetchEntity<{ currency?: { meta?: { href?: string } } }>(
    token,
    '/context/companysettings',
  );
  const href = settings?.currency?.meta?.href;
  if (!href) return null;
  // href: https://api.moysklad.ru/api/remap/1.2/entity/currency/{uuid}
  const id = extractUuid(href);
  if (!id) return null;
  const currency = await fetchEntity<{
    isoCode?: string;
    name?: string;
    fullName?: string;
  }>(token, `/entity/currency/${id}`);
  if (!currency) return null;
  const iso = (currency.isoCode ?? '').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[iso] ?? iso ?? currency.name ?? '';
  return {
    isoCode: iso,
    name: currency.fullName ?? currency.name ?? iso,
    symbol,
  };
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

export type CounterpartyGroup = { id: string; name: string };

/**
 * Контрагенты с ненулевым балансом — должники (нам должны) и кредиторы
 * (мы должны). Не зависит от кастомных атрибутов МойСклад.
 *
 * Знак баланса в /report/counterparty: <0 — клиент должен нам, >0 — мы
 * должны клиенту (по бухгалтерскому соглашению МойСклад).
 */
export async function loadDebtors(
  token: string,
  onProgress?: (e: DebtorsProgress) => void,
): Promise<{ rows: DebtCandidate[]; groups: CounterpartyGroup[] }> {
  const reports = await fetchAllParallel<MsCounterpartyReport>(
    token,
    '/report/counterparty',
    500,
    (n) => onProgress?.({ stage: 'reports', count: n }),
  );
  const nonZero = reports.filter((r) => r.balance !== 0);
  if (nonZero.length === 0) return { rows: [], groups: [] };

  const ids = nonZero
    .map((r) => extractUuid(r.counterparty?.meta?.href))
    .filter((id): id is string => !!id);

  const cards = await fetchCounterpartiesBatch(token, ids, (done, total) =>
    onProgress?.({ stage: 'cards', done, total }),
  );

  // Соберём все встречающиеся группы и подтянем их названия отдельным батчем —
  // в /entity/counterparty group выглядит как { meta: href } без name.
  const groupIds = new Set<string>();
  for (const cp of cards.values()) {
    const gid = extractUuid(cp.group?.meta?.href);
    if (gid) groupIds.add(gid);
  }
  const groupNames = await fetchGroupsBatch(token, [...groupIds]);

  const rows: DebtCandidate[] = nonZero.map((r) => {
    const cpId = extractUuid(r.counterparty?.meta?.href) ?? '';
    const cp = cards.get(cpId);
    const gid = extractUuid(cp?.group?.meta?.href) ?? undefined;
    const balance = r.balance / 100;
    return {
      demandId: cpId,
      demandName: r.demandsCount ? `${r.demandsCount} отгрузок` : '—',
      demandMoment: r.lastDemandDate ?? new Date().toISOString(),
      demandSum: (r.demandsSum ?? 0) / 100,
      counterpartyId: cpId,
      counterpartyName: cp?.name ?? `Контрагент ${cpId.slice(0, 8)}`,
      counterpartyPhone: cp?.phone,
      balance,
      debtAmount: Math.abs(balance),
      kind: balance < 0 ? 'debtor' : 'creditor',
      groupId: gid,
      groupName: gid ? groupNames.get(gid) : undefined,
    };
  });
  rows.sort((a, b) => b.debtAmount - a.debtAmount);

  const groups: CounterpartyGroup[] = [...groupIds]
    .map((id) => ({ id, name: groupNames.get(id) ?? id.slice(0, 8) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  return { rows, groups };
}

/**
 * Подтягивает агентов (контрагентов) из переданных id и для тех, у кого
 * выставлен state в МойСклад, возвращает Map<agentId, RfmSegment> по
 * маппингу русских названий статусов. Карточки без статуса — пропускаются
 * (для них останется автоматический RFM-сегмент).
 */
async function loadCustomerSegments(
  token: string,
  agentIds: string[],
): Promise<Map<string, import('../analytics/rfm').RfmSegment>> {
  const out = new Map<string, import('../analytics/rfm').RfmSegment>();
  if (agentIds.length === 0) return out;

  // 1. Словарь состояний counterparty (id → name) — один запрос.
  let stateNameById = new Map<string, string>();
  try {
    const metadata = await fetchEntity<{ states?: Array<{ id: string; name: string }> }>(
      token,
      '/entity/counterparty/metadata',
    );
    for (const st of metadata?.states ?? []) {
      stateNameById.set(st.id, st.name);
    }
  } catch {
    /* без названий статусов мы всё равно не сможем мапить — выходим */
  }
  if (stateNameById.size === 0) return out;

  // 2. Карточки контрагентов батчами (state приходит как ссылка с meta.href).
  const BATCH = 50;
  const batches: string[][] = [];
  for (let i = 0; i < agentIds.length; i += BATCH) {
    batches.push(agentIds.slice(i, i + BATCH));
  }
  try {
    let nextIdx = 0;
    const concurrency = Math.min(5, batches.length);
    const workers = Array.from({ length: concurrency }, async () => {
      while (true) {
        const idx = nextIdx++;
        if (idx >= batches.length) break;
        const chunk = batches[idx];
        const filter = chunk.map((id) => `id=${id}`).join(';');
        const path = `/entity/counterparty?filter=${encodeURIComponent(filter)}&limit=${chunk.length}`;
        const page = await fetchPage<MsCounterparty>(token, path);
        for (const cp of page.rows) {
          const stateId = extractUuid(cp.state?.meta?.href);
          if (!stateId) continue;
          const statusName = stateNameById.get(stateId);
          const seg = mapMsStatusToSegment(statusName);
          if (seg) out.set(cp.id, seg);
        }
      }
    });
    await Promise.all(workers);
  } catch {
    /* не критично */
  }
  return out;
}

async function fetchGroupsBatch(
  token: string,
  ids: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const BATCH = 50;
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += BATCH) chunks.push(ids.slice(i, i + BATCH));
  try {
    for (const chunk of chunks) {
      const filter = chunk.map((id) => `id=${id}`).join(';');
      const page = await fetchPage<{ id: string; name: string }>(
        token,
        `/entity/group?filter=${encodeURIComponent(filter)}&limit=${chunk.length}`,
      );
      for (const g of page.rows) map.set(g.id, g.name);
    }
  } catch {
    /* не критично — группы покажутся как id */
  }
  return map;
}
