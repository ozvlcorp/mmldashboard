'use client';

import { useMemo, useRef, useState } from 'react';
import { Crown, Award, AlertOctagon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';
import { buildAbcReport, summarizeAbc, type AbcInput, type AbcRow } from '@/lib/analytics/abc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { fmt, cn } from '@/lib/utils';
import { KpiTile } from '@/components/kpi-tile';
import { useT } from '@/lib/i18n/provider';

const classColors = { A: '#10b981', B: '#f59e0b', C: '#ef4444' };

export function AbcView({
  inputs,
  currency = 'сум',
}: {
  inputs: AbcInput[];
  currency?: string;
}) {
  const { t } = useT();
  const valueLabel = t('col.value');
  const rows = useMemo(() => buildAbcReport(inputs), [inputs]);
  const groups = useMemo(() => summarizeAbc(rows), [rows]);

  const tableRef = useRef<HTMLDivElement>(null);
  const [classFilter, setClassFilter] = useState<'A' | 'B' | 'C' | null>(null);
  const displayedRows = useMemo(
    () => (classFilter ? rows.filter((r) => r.class === classFilter) : rows),
    [rows, classFilter],
  );
  const toggleClass = (c: 'A' | 'B' | 'C') => {
    setClassFilter((prev) => (prev === c ? null : c));
    tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const pctOfTotal = (count: number) =>
    rows.length > 0 ? (count / rows.length) * 100 : 0;

  const chartData = rows.map((r) => ({
    name: r.name.length > 14 ? r.name.slice(0, 13) + '…' : r.name,
    value: r.value,
    cumShare: r.cumShare * 100,
    class: r.class,
  }));

  const columns: Column<AbcRow>[] = [
    {
      key: 'rank',
      header: '#',
      align: 'center',
      width: 60,
      render: (r) => (
        <span className="text-[12px] font-bold text-(--color-muted-fg)">{r.rank}</span>
      ),
      sortAccessor: (r) => r.rank,
      exportValue: (r) => r.rank,
      exportHeader: 'Ранг',
    },
    {
      key: 'class',
      header: t('col.class'),
      help: 'A — топ ~80% выручки (главные товары), B — ещё ~15% (нужно поддерживать), C — оставшиеся ~5% (можно сократить).',
      align: 'center',
      width: 90,
      render: (r) => <Badge variant={r.class}>{r.class}</Badge>,
      sortAccessor: (r) => r.class,
      exportValue: (r) => r.class,
    },
    {
      key: 'name',
      header: t('col.product'),
      align: 'left',
      width: 280,
      minWidth: 160,
      render: (r) => <span className="font-semibold">{r.name}</span>,
      sortAccessor: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: 'value',
      header: `${valueLabel}, ${currency}`,
      help: 'Вклад товара в общую метрику (по умолчанию — выручка за период).',
      align: 'right',
      width: 180,
      render: (r) => <span className="font-semibold">{fmt.money(r.value, currency)}</span>,
      sortAccessor: (r) => r.value,
      exportValue: (r) => Math.round(r.value),
      exportHeader: `${valueLabel}, ${currency}`,
    },
    {
      key: 'share',
      header: t('col.share'),
      help: 'Какую долю от общей выручки приносит этот товар.',
      align: 'right',
      width: 110,
      render: (r) => fmt.pct(r.share),
      sortAccessor: (r) => r.share,
      exportValue: (r) => +(r.share * 100).toFixed(2),
      exportHeader: 'Доля, %',
    },
    {
      key: 'cumShare',
      header: t('col.cumShare'),
      help: 'Накопленная доля — сумма долей всех товаров до этого (включая текущий). Когда переходит за 80% — товары становятся классом B; за 95% — классом C.',
      align: 'right',
      width: 210,
      minWidth: 180,
      render: (r) => (
        <div className="inline-flex items-center gap-2 justify-end w-full">
          <div className="w-16 h-1.5 rounded-full bg-(--color-muted) overflow-hidden">
            <div
              className="h-full bg-(--color-primary)"
              style={{ width: `${Math.min(100, r.cumShare * 100)}%` }}
            />
          </div>
          <span className="text-[12px] tabular-nums">{fmt.pct(r.cumShare)}</span>
        </div>
      ),
      sortAccessor: (r) => r.cumShare,
      exportValue: (r) => +(r.cumShare * 100).toFixed(2),
      exportHeader: 'Накопл. доля, %',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="oy-anim-card oy-stagger-1">
          <KpiTile
            label={t('kpi.classA')}
            value={`${groups.A.count}`}
            hint={`${fmt.pct(groups.A.share)} выручки · ${fmt.pct(pctOfTotal(groups.A.count) / 100)} товаров · ${fmt.money(groups.A.value, currency)}`}
            icon={Crown}
            accent="emerald"
            onClick={() => toggleClass('A')}
            className={
              classFilter === 'A' ? 'ring-2 ring-(--color-success)/40' : ''
            }
          />
        </div>
        <div className="oy-anim-card oy-stagger-2">
          <KpiTile
            label={t('kpi.classB')}
            value={`${groups.B.count}`}
            hint={`${fmt.pct(groups.B.share)} выручки · ${fmt.pct(pctOfTotal(groups.B.count) / 100)} товаров · ${fmt.money(groups.B.value, currency)}`}
            icon={Award}
            accent="amber"
            onClick={() => toggleClass('B')}
            className={
              classFilter === 'B' ? 'ring-2 ring-(--color-warning)/40' : ''
            }
          />
        </div>
        <div className="oy-anim-card oy-stagger-3">
          <KpiTile
            label={t('kpi.classC')}
            value={`${groups.C.count}`}
            hint={`${fmt.pct(groups.C.share)} выручки · ${fmt.pct(pctOfTotal(groups.C.count) / 100)} товаров · ${fmt.money(groups.C.value, currency)}`}
            icon={AlertOctagon}
            accent="rose"
            onClick={() => toggleClass('C')}
            className={
              classFilter === 'C' ? 'ring-2 ring-(--color-danger)/40' : ''
            }
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('card.paretoTitle')}</CardTitle>
          <CardDescription>{t('card.paretoDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => fmt.int(v / 1000) + 'k'}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tickFormatter={(v) => v + '%'}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e6e9ef',
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number, name) =>
                    name === 'cumShare' ? `${value.toFixed(1)}%` : fmt.money(value)
                  }
                />
                <Bar yAxisId="left" dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={classColors[entry.class as 'A' | 'B' | 'C']} />
                  ))}
                </Bar>
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumShare"
                  stroke="#4a65ff"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4a65ff' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card ref={tableRef}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{t('app.allItems')}</CardTitle>
              <CardDescription>
                {classFilter
                  ? `${displayedRows.length} класса ${classFilter} из ${rows.length}`
                  : t('card.allPositions.desc', { count: rows.length })}
              </CardDescription>
            </div>
            {classFilter && (
              <button
                onClick={() => setClassFilter(null)}
                className="inline-flex items-center gap-1.5 rounded-md bg-(--color-primary-soft) px-2 py-1 text-[11px] font-semibold text-(--color-primary-soft-fg) hover:bg-(--color-primary-soft)/70"
              >
                Класс {classFilter} · сбросить
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <DataTable
            key={`abc-${classFilter ?? 'all'}`}
            data={displayedRows}
            columns={columns}
            rowKey={(r) => r.id}
            defaultSort={{ key: 'value', dir: 'desc' }}
            tableId="abc"
            exportName="OY_Analytics_ABC"
          />
        </CardContent>
      </Card>
    </div>
  );
}
