'use client';

import { useMemo, useRef, useState } from 'react';
import { Users, Crown, AlertTriangle, Coins } from 'lucide-react';
import {
  buildRfmReport,
  summarizeRfm,
  type RfmScored,
  type RfmTransaction,
  type RfmSegment,
} from '@/lib/analytics/rfm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { KpiTile } from '@/components/kpi-tile';
import { fmt, cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/provider';

const segmentColors: Record<RfmSegment, string> = {
  Champions: 'success',
  Loyal: 'success',
  'Potential Loyal': 'primary',
  New: 'info',
  Promising: 'warning',
  'Need Attention': 'warning',
  'At Risk': 'danger',
  Hibernating: 'muted',
  Lost: 'danger',
};

const segmentLabels: Record<RfmSegment, string> = {
  Champions: 'Чемпионы',
  Loyal: 'Лояльные',
  'Potential Loyal': 'Потенц. лояльные',
  New: 'Новые',
  Promising: 'Перспективные',
  'Need Attention': 'Требуют внимания',
  'At Risk': 'В зоне риска',
  Hibernating: 'Спящие',
  Lost: 'Потерянные',
};

export function RfmView({
  transactions,
  currency = 'сум',
}: {
  transactions: RfmTransaction[];
  currency?: string;
}) {
  const { t } = useT();
  const scored = useMemo(() => buildRfmReport(transactions), [transactions]);
  const summary = useMemo(() => summarizeRfm(scored), [scored]);

  const segmentEntries = useMemo(() => {
    const arr = [...summary.entries()];
    arr.sort((a, b) => b[1].revenue - a[1].revenue);
    return arr;
  }, [summary]);

  const totalRevenue = scored.reduce((s, c) => s + c.monetary, 0);
  const champions = summary.get('Champions');
  const atRisk = summary.get('At Risk');

  const tableRef = useRef<HTMLDivElement>(null);
  const [segmentFilter, setSegmentFilter] = useState<RfmSegment | null>(null);
  const displayedRows = useMemo(
    () => (segmentFilter ? scored.filter((r) => r.segment === segmentFilter) : scored),
    [scored, segmentFilter],
  );
  const toggleSegment = (s: RfmSegment) => {
    setSegmentFilter((prev) => (prev === s ? null : s));
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const columns: Column<RfmScored>[] = [
    {
      key: 'name',
      header: 'Клиент',
      align: 'left',
      width: 260,
      minWidth: 180,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-(--color-accent-5) to-(--color-primary) text-white grid place-items-center text-[11px] font-bold shrink-0">
            {r.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-semibold">{r.name}</span>
        </div>
      ),
      sortAccessor: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: 'segment',
      header: 'Сегмент',
      help: 'Группа поведения клиента: Чемпионы (555) — VIP, Лояльные — стабильные, В зоне риска — давно не покупают, Потерянные — почти ушли.',
      align: 'left',
      width: 180,
      render: (r) => (
        <Badge variant={segmentColors[r.segment]}>{segmentLabels[r.segment]}</Badge>
      ),
      sortAccessor: (r) => r.segment,
      exportValue: (r) => segmentLabels[r.segment],
    },
    {
      key: 'rfm',
      header: 'RFM',
      help: 'Трёхзначный код R-F-M (от 1 до 5 по каждой шкале). 555 = недавно, часто, много. 111 = давно, редко, мало.',
      align: 'center',
      width: 100,
      render: (r) => (
        <span className="font-mono font-bold text-(--color-primary)">{r.rfm}</span>
      ),
      sortAccessor: (r) => r.rfm,
      exportValue: (r) => r.rfm,
    },
    {
      key: 'r',
      header: 'R, дн',
      help: 'Recency — сколько дней прошло с последней покупки. Меньше = лучше.',
      align: 'right',
      width: 100,
      render: (r) => fmt.int(r.recencyDays),
      sortAccessor: (r) => r.recencyDays,
      exportValue: (r) => r.recencyDays,
      exportHeader: 'Дней с покупки',
    },
    {
      key: 'f',
      header: 'F, покуп.',
      help: 'Frequency — общее число покупок этого клиента за всё время.',
      align: 'right',
      width: 120,
      render: (r) => fmt.int(r.frequency),
      sortAccessor: (r) => r.frequency,
      exportValue: (r) => r.frequency,
      exportHeader: 'Кол-во покупок',
    },
    {
      key: 'm',
      header: 'M, выручка',
      help: 'Monetary — суммарная выручка от клиента за всё время.',
      align: 'right',
      width: 160,
      render: (r) => <span className="font-bold text-[15px]">{fmt.money(r.monetary)}</span>,
      sortAccessor: (r) => r.monetary,
      exportValue: (r) => Math.round(r.monetary),
      exportHeader: 'Выручка, сум',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="oy-anim-card oy-stagger-1">
          <KpiTile label={t('kpi.totalCustomers')} value={fmt.int(scored.length)} icon={Users} accent="indigo" />
        </div>
        <div className="oy-anim-card oy-stagger-2">
          <KpiTile
            label={t('kpi.champions')}
            value={fmt.int(champions?.count ?? 0)}
            hint={champions ? fmt.money(champions.revenue, currency) : '—'}
            icon={Crown}
            accent="emerald"
            onClick={() => toggleSegment('Champions')}
            className={segmentFilter === 'Champions' ? 'ring-2 ring-(--color-success)/40' : ''}
          />
        </div>
        <div className="oy-anim-card oy-stagger-3">
          <KpiTile
            label={t('kpi.atRisk')}
            value={fmt.int(atRisk?.count ?? 0)}
            hint={atRisk ? fmt.money(atRisk.revenue, currency) : '—'}
            icon={AlertTriangle}
            accent="rose"
            onClick={() => toggleSegment('At Risk')}
            className={segmentFilter === 'At Risk' ? 'ring-2 ring-(--color-danger)/40' : ''}
          />
        </div>
        <div className="oy-anim-card oy-stagger-4">
          <KpiTile label={t('kpi.totalRevenue')} value={fmt.money(totalRevenue, currency)} icon={Coins} accent="violet" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('card.rfmSegments')}</CardTitle>
          <CardDescription>{t('card.rfmSegments.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {segmentEntries.map(([seg, data]) => {
              const share = totalRevenue > 0 ? data.revenue / totalRevenue : 0;
              const active = segmentFilter === seg;
              return (
                <button
                  key={seg}
                  type="button"
                  onClick={() => toggleSegment(seg)}
                  className={cn(
                    'rounded-xl border bg-(--color-muted)/40 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)/30',
                    active
                      ? 'border-(--color-primary) ring-2 ring-(--color-primary)/30 bg-(--color-primary-soft)/30'
                      : 'border-(--color-border-soft)',
                  )}
                >
                  <Badge variant={segmentColors[seg]}>{segmentLabels[seg]}</Badge>
                  <div className="mt-3 text-[20px] font-bold num leading-none">{data.count}</div>
                  <div className="mt-2 text-[11px] text-(--color-muted-fg) leading-tight">
                    {fmt.money(data.revenue, currency)}
                  </div>
                  <div className="mt-2 h-1 rounded-full bg-(--color-card) overflow-hidden">
                    <div
                      className="h-full bg-(--color-primary)"
                      style={{ width: `${share * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-(--color-muted-fg)">
                    {fmt.pct(share)} выручки
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card ref={tableRef}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{t('app.topByRevenue')}</CardTitle>
              <CardDescription>
                {segmentFilter
                  ? `${displayedRows.length} в сегменте «${segmentLabels[segmentFilter]}» из ${scored.length}`
                  : t('card.allPositions.desc', { count: scored.length })}
              </CardDescription>
            </div>
            {segmentFilter && (
              <button
                onClick={() => setSegmentFilter(null)}
                className="inline-flex items-center gap-1.5 rounded-md bg-(--color-primary-soft) px-2 py-1 text-[11px] font-semibold text-(--color-primary-soft-fg) hover:bg-(--color-primary-soft)/70"
              >
                {segmentLabels[segmentFilter]} · сбросить
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <DataTable
            key={`rfm-${segmentFilter ?? 'all'}`}
            data={displayedRows}
            columns={columns}
            rowKey={(r) => r.id}
            defaultSort={{ key: 'm', dir: 'desc' }}
            tableId="rfm"
            exportName="OY_Analytics_RFM"
          />
        </CardContent>
      </Card>
    </div>
  );
}
