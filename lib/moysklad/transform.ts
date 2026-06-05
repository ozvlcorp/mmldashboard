/**
 * Преобразование сырых данных МойСклад в формат для аналитики.
 */

import type { InventoryInput } from '../analytics/inventory';
import type { AbcInput } from '../analytics/abc';
import type { XyzInput } from '../analytics/xyz';
import type { RfmTransaction } from '../analytics/rfm';
import type { MsAssortmentItem, MsAttribute, MsDemand } from './types';

/**
 * Из ассортимента + истории отгрузок собирает входы для inventory-анализа.
 * Средние дневные продажи считаются по фактическим отгрузкам за период.
 *
 * Если в МойСклад на товаре задано дополнительное поле «норматив запаса»,
 * передайте его имя или ID в `normDaysAttribute` — значение возьмётся оттуда.
 * Иначе используется `defaultNormDays`.
 */
/** Курс валюты к базовой: множитель = rate / multiplicity (база = 1). */
export type CurrencyRate = { symbol: string; rate: number; multiplicity: number };

export function assortmentToInventory(
  items: MsAssortmentItem[],
  demands: MsDemand[],
  opts: {
    periodDays: number;
    defaultNormDays?: number;
    priceTypeName?: string;
    normDaysAttribute?: string; // имя или ID кастомного атрибута
    /** Карта currencyId → { symbol, rate, multiplicity } для конвертации в базовую валюту. */
    currencyByHref?: Map<string, CurrencyRate>;
  } = { periodDays: 30 },
): InventoryInput[] {
  const fallbackNorm = opts.defaultNormDays ?? 10;
  const salesByProduct = new Map<string, number>();
  for (const d of demands) {
    for (const p of d.positions?.rows ?? []) {
      const id = extractAssortmentId(p.assortment?.meta?.href);
      if (!id) continue;
      salesByProduct.set(id, (salesByProduct.get(id) ?? 0) + p.quantity);
    }
  }

  const lookupRate = (href: string | undefined): CurrencyRate | undefined => {
    if (!href || !opts.currencyByHref) return undefined;
    const id = extractAssortmentId(href);
    if (!id) return undefined;
    return opts.currencyByHref.get(id);
  };
  // Коэффициент перевода в базовую валюту. База имеет rate=1, mult=1 → 1.
  const toBase = (cur: CurrencyRate | undefined): number =>
    cur && cur.rate > 0 && cur.multiplicity > 0 ? cur.rate / cur.multiplicity : 1;

  return items.map((it) => {
    const buyRate = lookupRate(it.buyPrice?.currency?.href);
    const salePicked = pickSalePrice(it, opts.priceTypeName);
    const saleRate = lookupRate(salePicked.currencyHref);

    // Исходные цены в валюте карточки
    const costOriginal = (it.buyPrice?.value ?? 0) / 100;
    const saleOriginal = salePicked.value / 100;

    // Конвертируем в базовую валюту аккаунта — только так маржа/наценка корректны
    const buyMul = toBase(buyRate);
    const saleMul = toBase(saleRate);
    const cost = costOriginal * buyMul;
    const sale = saleOriginal * saleMul;
    const converted = buyMul !== 1 || saleMul !== 1;

    const sold = salesByProduct.get(it.id) ?? 0;
    const avgDaily = opts.periodDays > 0 ? sold / opts.periodDays : 0;
    const normDays = extractNormDays(it.attributes, opts.normDaysAttribute, fallbackNorm);
    return {
      id: it.id,
      name: it.name,
      stock: it.stock ?? 0,
      costPrice: cost,
      salePrice: sale,
      avgDailySales: avgDaily,
      normDays,
      buyCurrency: buyRate?.symbol,
      saleCurrency: saleRate?.symbol,
      costPriceOriginal: costOriginal,
      salePriceOriginal: saleOriginal,
      converted,
    };
  });
}

/**
 * Достаёт значение норматива из массива атрибутов. Атрибут можно указать
 * либо по UUID, либо по имени (точное совпадение, потом без регистра).
 */
export function extractNormDays(
  attributes: MsAttribute[] | undefined,
  attrKey: string | undefined,
  fallback: number,
): number {
  if (!attrKey || !attributes?.length) return fallback;
  const match =
    attributes.find((a) => a.id === attrKey) ??
    attributes.find((a) => a.name === attrKey) ??
    attributes.find((a) => a.name.toLowerCase() === attrKey.toLowerCase());
  if (!match) return fallback;
  const v = match.value;
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return fallback;
}

function pickSalePrice(
  item: MsAssortmentItem,
  priceTypeName?: string,
): { value: number; currencyHref?: string } {
  const prices = item.salePrices ?? [];
  if (priceTypeName) {
    const match = prices.find((p) => p.priceType?.name === priceTypeName);
    if (match) return { value: match.value, currencyHref: match.currency?.href };
  }
  const first = prices[0];
  return { value: first?.value ?? 0, currencyHref: first?.currency?.href };
}

function extractAssortmentId(href: string | undefined): string | null {
  if (!href) return null;
  const m = href.match(/\/([0-9a-f-]{36})(?:\/|$|\?)/i);
  return m ? m[1] : null;
}

/** Группирует отгрузки по позициям и возвращает выручку по каждому SKU */
export function demandsToAbc(demands: MsDemand[]): AbcInput[] {
  const map = new Map<string, { name: string; value: number }>();
  for (const d of demands) {
    for (const p of d.positions?.rows ?? []) {
      const id = extractAssortmentId(p.assortment?.meta?.href);
      if (!id) continue;
      const value = (p.price * p.quantity) / 100;
      const prev = map.get(id);
      if (prev) {
        prev.value += value;
      } else {
        map.set(id, { name: p.assortment?.name ?? id, value });
      }
    }
  }
  return [...map.entries()].map(([id, v]) => ({ id, name: v.name, value: v.value }));
}

/**
 * Группирует отгрузки по SKU и недельным/месячным бакетам.
 * Возвращает массивы продаж по периодам для XYZ.
 */
export function demandsToXyz(
  demands: MsDemand[],
  opts: { bucketDays: number; periodsCount: number; until: Date },
): XyzInput[] {
  const { bucketDays, periodsCount, until } = opts;
  const map = new Map<string, { name: string; periods: number[] }>();

  for (const d of demands) {
    const moment = new Date(d.moment);
    if (!Number.isFinite(moment.getTime())) continue;
    const ageDays = Math.max(
      0,
      Math.floor((until.getTime() - moment.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const bucket = Math.floor(ageDays / bucketDays);
    if (bucket >= periodsCount) continue;
    const idx = periodsCount - 1 - bucket; // более старые слева

    for (const p of d.positions?.rows ?? []) {
      const id = extractAssortmentId(p.assortment?.meta?.href);
      if (!id) continue;
      let row = map.get(id);
      if (!row) {
        row = { name: p.assortment?.name ?? id, periods: new Array(periodsCount).fill(0) };
        map.set(id, row);
      }
      row.periods[idx] += p.quantity;
    }
  }

  return [...map.entries()].map(([id, v]) => ({ id, name: v.name, periods: v.periods }));
}

/** Каждая отгрузка → одна RFM-транзакция (агент = клиент) */
export function demandsToRfm(demands: MsDemand[]): RfmTransaction[] {
  return demands
    .filter((d) => d.agent?.meta?.href)
    .map((d) => ({
      customerId: extractAssortmentId(d.agent!.meta.href) ?? d.agent!.meta.href,
      customerName: d.agent?.name,
      date: d.moment,
      amount: d.sum / 100,
    }));
}
