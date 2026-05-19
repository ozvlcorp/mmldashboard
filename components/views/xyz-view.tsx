'use client';

import { useMemo } from 'react';
import { Zap, Activity, AlertCircle } from 'lucide-react';
import { buildXyzReport, type XyzInput, type XyzRow } from '@/lib/analytics/xyz';
import { fmt, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { KpiTile } from '@/components/kpi-tile';
import { useT } from '@/lib/i18n/provider';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export function XyzView({ inputs }: { inputs: XyzInput[] }) {
  const { t } = useT();
  const rows = useMemo(() => buildXyzReport(inputs), [inputs]);

  const counts = useMemo(() => {
    const c = { X: 0, Y: 0, Z: 0 };
    for (const r of rows) c[r.class]++;
    return c;
  }, [rows]);

  const top = useMemo(
    () => [...rows].sort((a, b) => b.totalSales - a.totalSales).slice(0, 5),
    [rows],
  );

  const seriesData = useMemo(() => {
    const periods = inputs[0]?.periods.length ?? 0;
    return Array.from({ length: periods }, (_, i) => {
      const row: Record<string, number | string> = { period: `Нед ${i + 1}` };
      for (const r of top) {
        const orig = inputs.find((x) => x.id === r.id);
        if (orig) row[r.name] = orig.periods[i] ?? 0;
      }
      return row;
    });
  }, [top, inputs]);

  const columns: Column<XyzRow>[] = [
    {
      key: 'class',
      header: 'Класс',
      help: 'X — стабильный спрос (CV ≤ 10%), Y — умеренные колебания (10–25%), Z — нерегулярный (>25%). Чем выше класс — тем легче прогнозировать.',
      align: 'center',
      width: 90,
      render: (r) => <Badge variant={r.class}>{r.class}</Badge>,
      sortAccessor: (r) => r.class,
      exportValue: (r) => r.class,
    },
    {
      key: 'name',
      header: 'Товар',
      align: 'left',
      width: 240,
      minWidth: 160,
      render: (r) => <span className="font-semibold">{r.name}</span>,
      sortAccessor: (r) => r.name,
      exportValue: (r) => r.name,
    },
    {
      key: 'mean',
      header: 'Среднее',
      help: 'Среднее число проданных штук за период (например, в неделю).',
      align: 'right',
      width: 120,
      render: (r) => fmt.num(r.mean, 1),
      sortAccessor: (r) => r.mean,
      exportValue: (r) => +r.mean.toFixed(2),
      exportHeader: 'Среднее за период',
    },
    {
      key: 'sd',
      header: 'Откл.',
      help: 'Стандартное отклонение — насколько сильно фактические продажи разлетаются вокруг среднего. Больше — нестабильнее.',
      align: 'right',
      width: 110,
      render: (r) => fmt.num(r.stddev, 1),
      sortAccessor: (r) => r.stddev,
      exportValue: (r) => +r.stddev.toFixed(2),
      exportHeader: 'Станд. отклонение',
    },
    {
      key: 'cv',
      header: 'CV',
      help: 'Коэффициент вариации = отклонение / среднее. Это «нормированный разброс» спроса. CV 5% — спрос как часы; CV 50% — рваный, непредсказуемый.',
      align: 'right',
      width: 110,
      render: (r) => {
        if (!Number.isFinite(r.cv)) return <span className="text-(--color-muted-fg)">∞</span>;
        const variant = r.cv <= 0.1 ? 'success' : r.cv <= 0.25 ? 'warning' : 'danger';
        return <Badge variant={variant}>{fmt.pct(r.cv)}</Badge>;
      },
      sortAccessor: (r) => (Number.isFinite(r.cv) ? r.cv : 1e12),
      exportValue: (r) => (Number.isFinite(r.cv) ? +(r.cv * 100).toFixed(2) : null),
      exportHeader: 'CV, %',
    },
    {
      key: 'total',
      header: 'Всего продано',
      align: 'right',
      width: 140,
      render: (r) => <span className="font-semibold">{fmt.int(r.totalSales)}</span>,
      sortAccessor: (r) => r.totalSales,
      exportValue: (r) => r.totalSales,
    },
  ];

  const lineColors = ['#4a65ff', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="oy-anim-card oy-stagger-1">
          <KpiTile label={t('kpi.classX')} value={`${counts.X}`} hint={t('kpi.classXHint')} icon={Zap} accent="emerald" />
        </div>
        <div className="oy-anim-card oy-stagger-2">
          <KpiTile label={t('kpi.classY')} value={`${counts.Y}`} hint={t('kpi.classYHint')} icon={Activity} accent="amber" />
        </div>
        <div className="oy-anim-card oy-stagger-3">
          <KpiTile label={t('kpi.classZ')} value={`${counts.Z}`} hint={t('kpi.classZHint')} icon={AlertCircle} accent="rose" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('card.xyzChart')}</CardTitle>
          <CardDescription>{t('card.xyzChart.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={seriesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e9ef" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
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
                />
                {top.map((r, i) => (
                  <Line
                    key={r.id}
                    type="monotone"
                    dataKey={r.name}
                    stroke={lineColors[i % lineColors.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('app.allItems')}</CardTitle>
          <CardDescription>{t('card.allPositions.desc', { count: rows.length })}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <DataTable
            data={rows}
            columns={columns}
            rowKey={(r) => r.id}
            defaultSort={{ key: 'cv', dir: 'asc' }}
            tableId="xyz"
            exportName="OY_Analytics_XYZ"
          />
        </CardContent>
      </Card>
    </div>
  );
}
