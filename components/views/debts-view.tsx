'use client';

import { useState } from 'react';
import {
  Users,
  AlertCircle,
  Coins,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
  Plus,
} from 'lucide-react';
import { fmt } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { DataTable, type Column } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KpiTile } from '@/components/kpi-tile';
import { useT } from '@/lib/i18n/provider';
import type { DebtCandidate } from '@/lib/moysklad/debts';

export function DebtsView({
  initialDebtors = [],
  currency = 'сум',
  onScan,
  scanning = false,
  scanProgress,
  scanError,
  onCreateTask,
  assigneeName,
}: {
  initialDebtors?: DebtCandidate[];
  currency?: string;
  onScan?: () => void;
  scanning?: boolean;
  scanProgress?: string | null;
  scanError?: string | null;
  onCreateTask?: (d: DebtCandidate) => Promise<{ taskId: string }>;
  assigneeName?: string | null;
}) {
  const { t } = useT();
  const debtors = initialDebtors;
  const [taskCreated, setTaskCreated] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [taskErrors, setTaskErrors] = useState<Record<string, string>>({});

  const totalDebt = debtors.reduce((s, d) => s + d.debtAmount, 0);
  const avgDebt = debtors.length > 0 ? totalDebt / debtors.length : 0;

  const handleCreateTask = async (d: DebtCandidate) => {
    setBusy(d.demandId);
    setTaskErrors((prev) => {
      const next = { ...prev };
      delete next[d.demandId];
      return next;
    });
    try {
      if (onCreateTask) {
        await onCreateTask(d);
      } else {
        // demo-режим: фейк, чтобы кнопка визуально работала на демо-данных
        await new Promise((r) => setTimeout(r, 400));
      }
      setTaskCreated((prev) => new Set(prev).add(d.demandId));
    } catch (e) {
      setTaskErrors((prev) => ({
        ...prev,
        [d.demandId]: e instanceof Error ? e.message : String(e),
      }));
    } finally {
      setBusy(null);
    }
  };

  const handleTelegram = (d: DebtCandidate) => {
    const text = `Здравствуйте! Напоминаем о задолженности ${fmt.money(d.debtAmount)} сум по отгрузке ${d.demandName}.`;
    const url = new URL('/api/telegram/send', window.location.origin);
    if (d.counterpartyPhone) url.searchParams.set('phone', d.counterpartyPhone);
    url.searchParams.set('text', text);
    window.open(url.toString(), '_blank');
  };

  const columns: Column<DebtCandidate>[] = [
    {
      key: 'counterparty',
      header: 'Контрагент',
      align: 'left',
      width: 260,
      minWidth: 180,
      render: (d) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-(--color-danger) to-(--color-accent-4) text-white grid place-items-center text-[11px] font-bold shrink-0">
            {d.counterpartyName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-(--color-fg)">{d.counterpartyName}</div>
            {d.counterpartyPhone && (
              <div className="text-[11px] text-(--color-muted-fg)">
                {d.counterpartyPhone}
              </div>
            )}
          </div>
        </div>
      ),
      sortAccessor: (d) => d.counterpartyName,
      exportValue: (d) => d.counterpartyName,
    },
    {
      key: 'phone',
      header: 'Телефон',
      hidden: true,
      align: 'left',
      render: () => null,
      exportValue: (d) => d.counterpartyPhone ?? '',
    },
    {
      key: 'demand',
      header: 'Отгрузка',
      help: 'Документ отгрузки в МойСклад, по которому у клиента образовался долг.',
      align: 'left',
      width: 160,
      render: (d) => (
        <div className="leading-tight">
          <div className="font-semibold">{d.demandName}</div>
          <div className="text-[11px] text-(--color-muted-fg)">
            {new Date(d.demandMoment).toLocaleDateString('ru-RU')}
          </div>
        </div>
      ),
      sortAccessor: (d) => d.demandMoment,
      exportValue: (d) => d.demandName,
    },
    {
      key: 'demandDate',
      header: 'Дата отгрузки',
      hidden: true,
      align: 'right',
      render: () => null,
      exportValue: (d) => new Date(d.demandMoment).toLocaleDateString('ru-RU'),
    },
    {
      key: 'debt',
      header: 'Долг',
      help: 'Текущая сумма задолженности клиента по балансу. Под цифрой — общая сумма самой отгрузки.',
      align: 'right',
      width: 160,
      render: (d) => (
        <div className="leading-tight">
          <div className="font-bold text-[16px] text-(--color-danger)">{fmt.money(d.debtAmount)}</div>
          <div className="text-[12px] text-(--color-muted-fg) mt-0.5">из {fmt.money(d.demandSum)}</div>
        </div>
      ),
      sortAccessor: (d) => d.debtAmount,
      exportValue: (d) => Math.round(d.debtAmount),
      exportHeader: 'Долг, сум',
    },
    {
      key: 'demandSum',
      header: 'Сумма отгрузки',
      hidden: true,
      align: 'right',
      render: () => null,
      exportValue: (d) => Math.round(d.demandSum),
      exportHeader: 'Сумма отгрузки, сум',
    },
    {
      key: 'status',
      header: 'Статус',
      align: 'center',
      width: 150,
      render: (d) => (
        <div className="flex flex-col items-center gap-1">
          {taskCreated.has(d.demandId) ? (
            <Badge variant="success">
              <CheckCircle2 size={11} className="mr-1" />
              Задача создана
            </Badge>
          ) : (
            <Badge variant="warning">Ожидает</Badge>
          )}
          {taskErrors[d.demandId] && (
            <span
              className="max-w-[140px] truncate text-[10px] text-rose-600"
              title={taskErrors[d.demandId]}
            >
              {taskErrors[d.demandId]}
            </span>
          )}
        </div>
      ),
      sortAccessor: (d) => (taskCreated.has(d.demandId) ? 1 : 0),
      exportValue: (d) => (taskCreated.has(d.demandId) ? 'Задача создана' : 'Ожидает'),
    },
    {
      key: 'actions',
      header: 'Действия',
      align: 'right',
      width: 240,
      render: (d) => (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCreateTask(d)}
            disabled={busy === d.demandId || taskCreated.has(d.demandId)}
          >
            {busy === d.demandId ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Задача
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleTelegram(d)}
            disabled={!d.counterpartyPhone}
          >
            <MessageCircle size={13} />
            Telegram
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="oy-anim-card oy-stagger-1">
          <KpiTile label={t('kpi.debtorsCount')} value={fmt.int(debtors.length)} icon={Users} accent="rose" />
        </div>
        <div className="oy-anim-card oy-stagger-2">
          <KpiTile label={t('kpi.totalDebt')} value={fmt.money(totalDebt, currency)} icon={Coins} accent="rose" trend={{ value: 8.2, positive: false }} />
        </div>
        <div className="oy-anim-card oy-stagger-3">
          <KpiTile label={t('kpi.avgDebt')} value={fmt.money(avgDebt, currency)} icon={AlertCircle} accent="amber" />
        </div>
        <div className="oy-anim-card oy-stagger-4">
          <KpiTile
            label={t('kpi.tasksCreated')}
            value={`${taskCreated.size} / ${debtors.length}`}
            icon={CheckCircle2}
            accent={taskCreated.size === debtors.length ? 'emerald' : 'indigo'}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{t('card.debtors')}</CardTitle>
              <CardDescription>{t('card.debtors.desc')}</CardDescription>
              {assigneeName && (
                <div className="mt-1 text-[11px] text-(--color-muted-fg)">
                  Задачи будут назначены: <span className="font-medium text-(--color-fg)">{assigneeName}</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onScan}
              disabled={scanning || !onScan}
            >
              <RefreshCw size={13} className={scanning ? 'animate-spin' : ''} />
              {scanning ? t('card.scanning') : t('card.scanDebt')}
            </Button>
          </div>
          {scanProgress && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-(--color-primary)/30 bg-(--color-primary-soft) px-2.5 py-1 text-[11px] font-medium text-(--color-primary-soft-fg)">
              <RefreshCw size={11} className="animate-spin" />
              {scanProgress}
            </div>
          )}
          {scanError && (
            <div className="mt-2 rounded-md border border-rose-300/50 bg-rose-50/70 px-2.5 py-1 text-[11px] text-rose-700">
              {scanError}
            </div>
          )}
        </CardHeader>
        <CardContent className="px-0 py-0">
          {debtors.length === 0 && !scanning ? (
            <div className="px-6 py-10 text-center text-[13px] text-(--color-muted-fg)">
              {onScan
                ? 'Нажмите «Запустить сканирование» — найдём контрагентов с отрицательным балансом.'
                : 'Должников не найдено.'}
            </div>
          ) : (
            <DataTable
              data={debtors}
              columns={columns}
              rowKey={(d) => d.demandId}
              defaultSort={{ key: 'debt', dir: 'desc' }}
              tableId="debts"
              exportName="OY_Analytics_Debts"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Как это работает</CardTitle>
          <CardDescription>Пайплайн ежедневной проверки долгов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {[
              {
                step: 1,
                title: 'Поиск отгрузок',
                text: 'Cron фильтрует /entity/demand по кастомному атрибуту «Дата напоминания» = сегодня',
              },
              {
                step: 2,
                title: 'Проверка баланса',
                text: '/report/counterparty — если balance ≥ 0, пропускаем; если долг — продолжаем',
              },
              {
                step: 3,
                title: 'Создание задачи',
                text: 'POST /entity/task с описанием долга и ссылкой на Telegram-вебхук',
              },
              {
                step: 4,
                title: 'Клик менеджера',
                text: 'Кликая ссылку в задаче, менеджер триггерит /api/telegram/send → бот шлёт клиенту',
              },
            ].map((s) => (
              <div
                key={s.step}
                className="rounded-xl p-4 bg-(--color-muted)/50 border border-(--color-border-soft) relative"
              >
                <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-(--color-primary) text-white grid place-items-center text-[11px] font-bold shadow-[0_4px_12px_rgba(74,101,255,0.35)]">
                  {s.step}
                </div>
                <div className="text-[13px] font-bold text-(--color-fg) mt-2">{s.title}</div>
                <div className="text-[12px] text-(--color-muted-fg) mt-1 leading-snug">{s.text}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
