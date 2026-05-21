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
import type { MsAssortmentItem, MsDemand, MsListResponse } from './types';

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
  };
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

async function fetchAll<T>(
  token: string,
  initialPath: string,
  onCount: (n: number) => void,
): Promise<T[]> {
  const out: T[] = [];
  let url: string | null = initialPath;
  while (url) {
    const page: MsListResponse<T> = await fetchPage<T>(token, url);
    out.push(...page.rows);
    onCount(out.length);
    url = page.meta?.nextHref ?? null;
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
  const assortment = await fetchAll<MsAssortmentItem>(
    token,
    '/entity/assortment?stockStore.byStore=true&limit=500',
    (n) => onProgress?.({ stage: 'assortment', count: n }),
  );

  // Отгрузки с expand жирнее — берём меньшими страницами
  const qp = new URLSearchParams({
    filter: `moment>=${msMoment(from)};moment<=${msMoment(until)}`,
    expand: 'positions.assortment,agent',
    order: 'moment,asc',
    limit: '100',
  });
  const demands = await fetchAll<MsDemand>(
    token,
    `/entity/demand?${qp.toString()}`,
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
    },
  };
}
