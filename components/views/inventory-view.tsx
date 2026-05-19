'use client';

import { useMemo } from 'react';
import {
  Boxes,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Snowflake,
  Rocket,
} from 'lucide-react';
import {
  buildInventoryReport,
  type InventoryInput,
} from '@/lib/analytics/inventory';
import { fmt, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiTile } from '@/components/kpi-tile';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/provider';
import type { InventoryRow } from '@/lib/analytics/inventory';

// Симуляция исторического тренда для KPI спарклайнов
function genSpark(value: number, n = 12, vol = 0.12, seed = 1): number[] {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: n }, (_, i) => {
    const trend = (i / n) * 0.3 + 0.7;
    const noise = (rand() - 0.5) * 2 * vol;
    return Math.max(0, value * trend * (1 + noise));
  });
}

export function InventoryView({
  inputs,
  horizonDays = 10,
  currency = 'сум',
}: {
  inputs: InventoryInput[];
  horizonDays?: number;
  currency?: string;
}) {
  const { t } = useT();
  const report = useMemo(() => buildInventoryReport(inputs, { horizonDays }), [
    inputs,
    horizonDays,
  ]);
  const { rows, totals } = report;

  const columns: Column<InventoryRow>[] = [
    {
      key: 'name',
      header: 'Товар',
      align: 'left',
      width: 240,
      minWidth: 160,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-(--color-primary-soft) text-(--color-primary-soft-fg) grid place-items-center text-[11px] font-bold shrink-0">
            {r.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-(--color-fg) text-[13px]">{r.name}</div>
            <div className="text-[11px] text-(--color-muted-fg)">
              {r.mmlFlag && <span className="text-(--color-primary) font-medium">★ MML · </span>}
              {fmt.pct(r.share)} выручки
            </div>
          </div>
        </div>
      ),
      sortAccessor: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: 'stock',
      header: 'Остаток',
      help: 'Сколько штук товара сейчас на складе. Под цифрой — стоимость остатка в деньгах (остаток × закупочная цена).',
      align: 'right',
      width: 130,
      render: (r) => (
        <div className="leading-tight">
          <div className="font-bold text-[15px]">{fmt.int(r.stock)} <span className="text-[12px] font-medium text-(--color-muted-fg)">шт</span></div>
          <div className="text-[12px] text-(--color-muted-fg) mt-0.5">{fmt.money(r.stockValue)}</div>
        </div>
      ),
      sortAccessor: (r) => r.stockValue,
      exportValue: (r) => r.stock,
      exportHeader: 'Остаток, шт',
    },
    {
      key: 'stockValue',
      header: 'Стоимость остатка',
      hidden: true,
      align: 'right',
      render: () => null,
      sortAccessor: (r) => r.stockValue,
      exportValue: (r) => Math.round(r.stockValue),
    },
    {
      key: 'stockDays',
      header: 'Запас, дн',
      help: 'На сколько дней хватит текущего остатка при средней дневной продаже. Зелёный — норма, жёлтый — много, красный — дефицит (меньше норматива).',
      align: 'center',
      width: 110,
      render: (r) => {
        const v = r.stockDays;
        const isLow = v < r.normDays;
        const isHigh = v > r.normDays * 3;
        return (
          <Badge variant={isLow ? 'danger' : isHigh ? 'warning' : 'success'}>
            {Number.isFinite(v) ? `${fmt.num(v, 1)} дн` : '∞'}
          </Badge>
        );
      },
      sortAccessor: (r) => (Number.isFinite(r.stockDays) ? r.stockDays : 1e12),
      exportValue: (r) => (Number.isFinite(r.stockDays) ? +r.stockDays.toFixed(1) : null),
    },
    {
      key: 'avg',
      header: 'Прод./день',
      help: 'Среднее количество штук, продаваемое в день. Считается из истории отгрузок за выбранный период.',
      align: 'right',
      width: 110,
      render: (r) => fmt.num(r.avgDailySales, 1),
      sortAccessor: (r) => r.avgDailySales,
      exportValue: (r) => +r.avgDailySales.toFixed(2),
    },
    {
      key: 'prices',
      header: 'Цена',
      help: 'Цена продажи (вверху) и закупочная цена (внизу). Разница между ними — валовая прибыль с одной штуки.',
      align: 'right',
      width: 130,
      render: (r) => (
        <div className="leading-tight">
          <div className="font-bold text-[15px]">{fmt.money(r.salePrice)}</div>
          <div className="text-[12px] text-(--color-muted-fg) mt-0.5">закуп. {fmt.money(r.costPrice)}</div>
        </div>
      ),
      sortAccessor: (r) => r.salePrice,
      exportValue: (r) => Math.round(r.salePrice),
      exportHeader: 'Цена продажи',
    },
    {
      key: 'cost',
      header: 'Закуп.',
      hidden: true,
      align: 'right',
      render: () => null,
      exportValue: (r) => Math.round(r.costPrice),
      exportHeader: 'Цена закупки',
    },
    {
      key: 'margin',
      header: 'Маржа',
      help: 'Маржа = (продажа − закупка) / продажа. Показывает, какую долю от цены продажи составляет прибыль. Не путать с наценкой!',
      align: 'right',
      width: 120,
      render: (r) => (
        <div className="leading-tight">
          <div className="font-bold text-[15px] text-(--color-success)">{fmt.pct(r.margin)}</div>
          <div className="text-[12px] text-(--color-muted-fg) mt-0.5">наценка {fmt.pct(r.markup)}</div>
        </div>
      ),
      sortAccessor: (r) => r.margin,
      exportValue: (r) => +(r.margin * 100).toFixed(2),
      exportHeader: 'Маржа, %',
    },
    {
      key: 'markup',
      header: 'Наценка',
      hidden: true,
      align: 'right',
      render: () => null,
      exportValue: (r) => +(r.markup * 100).toFixed(2),
      exportHeader: 'Наценка, %',
    },
    {
      key: 'daily',
      header: 'Доход/день',
      help: 'Сколько прибыли в день приносит этот товар. Доход/день = (продажа − закупка) × средняя дневная продажа.',
      align: 'right',
      width: 120,
      render: (r) => <span className="font-bold text-[15px]">{fmt.money(r.dailyGross)}</span>,
      sortAccessor: (r) => r.dailyGross,
      exportValue: (r) => Math.round(r.dailyGross),
    },
    {
      key: 'oos',
      header: 'OOS / Заморожено',
      help: 'OOS (out of stock — нет на складе): сколько прибыли теряем из-за дефицита. ❄ Заморожено: сколько денег лежит мёртвым грузом сверх норматива запаса.',
      align: 'right',
      width: 160,
      render: (r) =>
        r.oosLoss > 0 ? (
          <Badge variant="danger">−{fmt.money(r.oosLoss)}</Badge>
        ) : r.frozenMoney > 0 ? (
          <Badge variant="warning">{fmt.money(r.frozenMoney)} ❄</Badge>
        ) : (
          <span className="text-(--color-muted-fg) text-[12px]">в норме</span>
        ),
      sortAccessor: (r) => r.frozenMoney - r.oosLoss,
      exportValue: (r) =>
        r.oosLoss > 0 ? -Math.round(r.oosLoss) : Math.round(r.frozenMoney),
      exportHeader: 'OOS (−) или Заморожено (+), сум',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          {
            label: t('kpi.stockValue'),
            value: fmt.money(totals.stockValue, currency),
            icon: Boxes, accent: 'indigo' as const,
            trend: { value: 8.4, positive: true },
            spark: genSpark(totals.stockValue, 12, 0.08, 1),
          },
          {
            label: t('kpi.dailyIncome'),
            value: fmt.money(totals.dailyGross, currency),
            hint: t('kpi.dailyIncomeHint', { days: horizonDays, value: fmt.money(totals.potentialProfit, currency) }),
            icon: TrendingUp, accent: 'emerald' as const,
            trend: { value: 12.1, positive: true },
            spark: genSpark(totals.dailyGross, 12, 0.18, 2),
          },
          {
            label: t('kpi.mmlShare'), value: fmt.pct(totals.mmlShare),
            hint: t('kpi.mmlHint'),
            icon: Rocket, accent: 'violet' as const,
            trend: { value: 3.2, positive: true },
            spark: genSpark(totals.mmlShare, 12, 0.05, 3),
          },
          {
            label: t('kpi.oosLoss', { days: horizonDays }),
            value: fmt.money(totals.lostProfit, currency),
            icon: AlertTriangle, accent: 'rose' as const,
            trend: { value: -15.8, positive: false },
            spark: genSpark(totals.lostProfit, 12, 0.25, 4),
          },
          {
            label: t('kpi.frozen'), value: fmt.money(totals.frozenMoney, currency),
            hint: t('kpi.frozenHint', { pct: fmt.pct(totals.frozenShare) }),
            icon: Snowflake, accent: 'amber' as const,
            trend: { value: -2.1, positive: false },
            spark: genSpark(totals.frozenMoney, 12, 0.05, 5),
          },
          {
            label: t('kpi.upliftAtZero'), value: `+${fmt.pct(totals.profitUpliftPct)}`,
            hint: t('kpi.upliftHint', { x: fmt.num(totals.profitUpliftX, 2) }),
            icon: Wallet, accent: 'cyan' as const,
            trend: { value: 0, positive: true },
          },
        ].map((k, i) => (
          <div key={k.label} className={cn('oy-anim-card', `oy-stagger-${(i % 6) + 1}`)}>
            <KpiTile {...k} />
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Аналитика по товарам</CardTitle>
              <CardDescription>
                {inputs.length} позиций · кликните по заголовку столбца для сортировки
              </CardDescription>
            </div>
            <Badge variant="primary">{horizonDays} дн</Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <DataTable
            data={rows}
            columns={columns}
            rowKey={(r) => r.id}
            defaultSort={{ key: 'stockValue', dir: 'desc' }}
            tableId="inventory"
            exportName="OY_Analytics_Sklad"
            toolbar="Перетащите границу столбца чтобы изменить ширину"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Бизнес-итог за {horizonDays} дней</CardTitle>
            <CardDescription>Возможный доход против реального и потери</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-(--color-muted-fg)">Возможная прибыль</div>
                  <div className="text-[22px] font-bold num">
                    {fmt.money(totals.potentialProfit, currency)}
                  </div>
                </div>
                <div className="h-2 w-[55%] rounded-full bg-(--color-muted) overflow-hidden">
                  <div className="h-full bg-(--color-primary)" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-(--color-muted-fg)">Фактическая прибыль</div>
                  <div className="text-[22px] font-bold num text-(--color-success)">
                    {fmt.money(totals.actualProfit, currency)}
                  </div>
                </div>
                <div className="h-2 w-[55%] rounded-full bg-(--color-muted) overflow-hidden">
                  <div
                    className="h-full bg-(--color-success)"
                    style={{
                      width: `${(totals.actualProfit / Math.max(1, totals.potentialProfit)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-(--color-muted-fg)">Потери OOS</div>
                  <div className="text-[22px] font-bold num text-(--color-danger)">
                    −{fmt.money(totals.lostProfit, currency)}
                  </div>
                </div>
                <div className="h-2 w-[55%] rounded-full bg-(--color-muted) overflow-hidden">
                  <div
                    className="h-full bg-(--color-danger)"
                    style={{
                      width: `${(totals.lostProfit / Math.max(1, totals.potentialProfit)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Что делать</CardTitle>
            <CardDescription>Готовые действия для роста прибыли</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rows
                .filter((r) => r.oosLoss > 0 || r.frozenMoney > 1000000)
                .slice(0, 3)
                .map((r) => (
                  <div
                    key={r.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-(--color-muted)/50 border border-(--color-border-soft)"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${
                        r.oosLoss > 0
                          ? 'bg-(--color-danger-soft) text-(--color-danger)'
                          : 'bg-(--color-warning-soft) text-(--color-warning)'
                      }`}
                    >
                      {r.oosLoss > 0 ? (
                        <AlertTriangle size={16} strokeWidth={2.5} />
                      ) : (
                        <Snowflake size={16} strokeWidth={2.5} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-(--color-fg)">
                        {r.name}
                      </div>
                      <div className="text-[12px] text-(--color-muted-fg) mt-0.5">
                        {r.oosLoss > 0
                          ? `Дефицит. Заказать еще, теряете ${fmt.money(r.oosLoss)} за ${horizonDays} дн.`
                          : `Излишек запаса. Заморожено ${fmt.money(r.frozenMoney)} (${fmt.pct(r.frozenShare)}).`}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
