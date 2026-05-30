/**
 * Собирает компактную выжимку из аналитики магазина для ИИ-консультанта.
 *
 * Каталог может быть на 1000+ SKU — целиком в контекст не влезет и будет
 * дорого. Поэтому считаем агрегаты + топ-N по каждому интересному срезу
 * (что закупить, что заморожено, кто должник и т.д.) и отдаём ИИ только их.
 */

import { buildInventoryReport } from '../analytics/inventory';
import { buildAbcReport, summarizeAbc } from '../analytics/abc';
import { buildXyzReport, summarizeXyz } from '../analytics/xyz';
import { buildRfmReport, summarizeRfm } from '../analytics/rfm';
import type { AnalyticsResult } from '../moysklad/browser';
import type { DebtCandidate } from '../moysklad/debts';

export type ShopContext = {
  meta: AnalyticsResult['meta'];
  currency: string;
  horizonDays: number;
  inventoryTotals: {
    stockValue: number;
    dailyGross: number;
    mmlShare: number;
    oosLoss: number;
    frozenMoney: number;
    frozenShare: number;
    potentialProfit: number;
    actualProfit: number;
    profitUpliftPct: number;
  };
  topRestock: Array<{ name: string; oosLoss: number; stock: number; stockDays: number; avgDailySales: number }>;
  topFrozen: Array<{ name: string; frozenMoney: number; stock: number; stockDays: number }>;
  topRevenue: Array<{ name: string; dailyGross: number; share: number; mml: boolean }>;
  abc: { counts: Record<'A' | 'B' | 'C', { count: number; share: number; value: number }> };
  xyz: { counts: Record<'X' | 'Y' | 'Z', number> };
  rfm: {
    totalCustomers: number;
    totalRevenue: number;
    segments: Array<{ segment: string; count: number; revenue: number }>;
    topCustomers: Array<{ name: string; monetary: number; recencyDays: number; frequency: number; segment: string }>;
  };
  debtors: { count: number; total: number; top: Array<{ name: string; debt: number }> };
};

function round(n: number): number {
  return Math.round(n);
}

export function buildShopContext(opts: {
  data: AnalyticsResult;
  debtors: DebtCandidate[] | null;
  currency: string;
  horizonDays: number;
}): ShopContext {
  const { data, debtors, currency, horizonDays } = opts;

  const inv = buildInventoryReport(data.inventory, { horizonDays });
  const abcRows = buildAbcReport(data.abc);
  const abcCounts = summarizeAbc(abcRows);
  const xyzRows = buildXyzReport(data.xyz);
  const xyzCounts = summarizeXyz(xyzRows);
  const rfmScored = buildRfmReport(data.rfm);
  const rfmSummary = summarizeRfm(rfmScored);

  const topRestock = [...inv.rows]
    .filter((r) => r.oosLoss > 0)
    .sort((a, b) => b.oosLoss - a.oosLoss)
    .slice(0, 15)
    .map((r) => ({
      name: r.name,
      oosLoss: round(r.oosLoss),
      stock: r.stock,
      stockDays: Number.isFinite(r.stockDays) ? round(r.stockDays) : 0,
      avgDailySales: Number(r.avgDailySales.toFixed(2)),
    }));

  const topFrozen = [...inv.rows]
    .filter((r) => r.frozenMoney > 0)
    .sort((a, b) => b.frozenMoney - a.frozenMoney)
    .slice(0, 15)
    .map((r) => ({
      name: r.name,
      frozenMoney: round(r.frozenMoney),
      stock: r.stock,
      stockDays: Number.isFinite(r.stockDays) ? round(r.stockDays) : 999,
    }));

  const topRevenue = [...inv.rows]
    .sort((a, b) => b.dailyGross - a.dailyGross)
    .slice(0, 15)
    .map((r) => ({
      name: r.name,
      dailyGross: round(r.dailyGross),
      share: Number((r.share * 100).toFixed(1)),
      mml: r.mmlFlag,
    }));

  const totalRevenue = rfmScored.reduce((s, c) => s + c.monetary, 0);
  const segments = [...rfmSummary.entries()]
    .map(([segment, v]) => ({ segment, count: v.count, revenue: round(v.revenue) }))
    .sort((a, b) => b.revenue - a.revenue);
  const topCustomers = [...rfmScored]
    .sort((a, b) => b.monetary - a.monetary)
    .slice(0, 10)
    .map((c) => ({
      name: c.name,
      monetary: round(c.monetary),
      recencyDays: c.recencyDays,
      frequency: c.frequency,
      segment: c.segment,
    }));

  const debtorList = debtors ?? [];
  const debtTop = [...debtorList]
    .sort((a, b) => b.debtAmount - a.debtAmount)
    .slice(0, 10)
    .map((d) => ({ name: d.counterpartyName, debt: round(d.debtAmount) }));

  return {
    meta: data.meta,
    currency,
    horizonDays,
    inventoryTotals: {
      stockValue: round(inv.totals.stockValue),
      dailyGross: round(inv.totals.dailyGross),
      mmlShare: Number((inv.totals.mmlShare * 100).toFixed(1)),
      oosLoss: round(inv.totals.oosLoss),
      frozenMoney: round(inv.totals.frozenMoney),
      frozenShare: Number((inv.totals.frozenShare * 100).toFixed(1)),
      potentialProfit: round(inv.totals.potentialProfit),
      actualProfit: round(inv.totals.actualProfit),
      profitUpliftPct: Number((inv.totals.profitUpliftPct * 100).toFixed(1)),
    },
    topRestock,
    topFrozen,
    topRevenue,
    abc: { counts: abcCounts },
    xyz: { counts: xyzCounts },
    rfm: {
      totalCustomers: rfmScored.length,
      totalRevenue: round(totalRevenue),
      segments,
      topCustomers,
    },
    debtors: {
      count: debtorList.length,
      total: round(debtorList.reduce((s, d) => s + d.debtAmount, 0)),
      top: debtTop,
    },
  };
}
