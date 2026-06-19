'use client';

import * as React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  /** Самая поздняя дата, которую можно выбрать (обычно сегодня). */
  maxDate?: string;
  /** Локализованные подписи. По умолчанию ru. */
  labels?: {
    placeholder?: string;
    apply?: string;
    cancel?: string;
    presets?: { d7?: string; d14?: string; d30?: string; d60?: string; d90?: string };
  };
};

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function fmtShort(s: string): string {
  const d = parseISO(s);
  if (!d) return '';
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function daysInMonth(year: number, monthIdx: number): number {
  return new Date(year, monthIdx + 1, 0).getDate();
}

export function DateRangePopover({
  from,
  to,
  onApply,
  maxDate,
  labels,
}: Props) {
  const today = maxDate ?? toISO(new Date());
  const [open, setOpen] = React.useState(false);
  const [draftFrom, setDraftFrom] = React.useState(from);
  const [draftTo, setDraftTo] = React.useState(to);
  // Месяц, отображаемый слева. Правый = +1.
  const [viewMonth, setViewMonth] = React.useState<Date>(() => {
    const d = parseISO(to) || parseISO(from) || new Date();
    return startOfMonth(addMonths(d, -1));
  });
  // Хвост клика: ждём ли мы вторую дату диапазона.
  const [pickStage, setPickStage] = React.useState<'from' | 'to'>('from');

  // Сброс черновика при открытии — синхронизируемся с актуальными props.
  React.useEffect(() => {
    if (open) {
      setDraftFrom(from);
      setDraftTo(to);
      setPickStage('from');
      const d = parseISO(to) || parseISO(from) || new Date();
      setViewMonth(startOfMonth(addMonths(d, -1)));
    }
  }, [open, from, to]);

  // Click outside → закрытие без применения.
  const rootRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Esc → закрытие; Enter → применение (если валидно).
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Enter') {
        const valid = draftFrom && draftTo && draftFrom <= draftTo;
        if (valid) {
          onApply(draftFrom, draftTo);
          setOpen(false);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, draftFrom, draftTo, onApply]);

  const valid = draftFrom && draftTo && draftFrom <= draftTo;
  const dirty = draftFrom !== from || draftTo !== to;

  const apply = () => {
    if (!valid) return;
    onApply(draftFrom, draftTo);
    setOpen(false);
  };

  const cancel = () => {
    setDraftFrom(from);
    setDraftTo(to);
    setOpen(false);
  };

  const pickPreset = (days: number) => {
    const t = parseISO(today) || new Date();
    const f = new Date(t.getFullYear(), t.getMonth(), t.getDate() - (days - 1));
    setDraftFrom(toISO(f));
    setDraftTo(toISO(t));
    setPickStage('from');
    setViewMonth(startOfMonth(addMonths(t, -1)));
  };

  const onDayClick = (iso: string) => {
    if (iso > today) return; // нельзя в будущее
    if (pickStage === 'from') {
      setDraftFrom(iso);
      setDraftTo(iso);
      setPickStage('to');
    } else {
      // Если кликнули раньше start — превращаем в новый start.
      if (iso < draftFrom) {
        setDraftFrom(iso);
        setDraftTo(iso);
        setPickStage('to');
      } else {
        setDraftTo(iso);
        setPickStage('from');
      }
    }
  };

  const l = {
    placeholder: labels?.placeholder ?? 'Выберите период',
    apply: labels?.apply ?? 'Применить',
    cancel: labels?.cancel ?? 'Отмена',
    p7: labels?.presets?.d7 ?? '7 дней',
    p14: labels?.presets?.d14 ?? '14 дней',
    p30: labels?.presets?.d30 ?? '30 дней',
    p60: labels?.presets?.d60 ?? '60 дней',
    p90: labels?.presets?.d90 ?? '90 дней',
  };

  const buttonLabel = from && to
    ? `${fmtShort(from)} — ${fmtShort(to)}`
    : l.placeholder;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-2 h-9 rounded-lg border bg-(--color-card) px-3 text-[12.5px] font-medium transition-colors',
          open
            ? 'border-(--color-primary)/60 ring-1 ring-(--color-primary)/20'
            : 'border-(--color-border) hover:border-(--color-primary)/40',
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar size={15} className="text-(--color-muted-fg)" />
        <span className="tabular-nums">{buttonLabel}</span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[640px] rounded-xl border border-(--color-border) bg-(--color-card) shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] p-4 oy-anim-fade"
        >
          <div className="flex gap-4">
            <PresetCol
              labels={[
                { k: 7, l: l.p7 },
                { k: 14, l: l.p14 },
                { k: 30, l: l.p30 },
                { k: 60, l: l.p60 },
                { k: 90, l: l.p90 },
              ]}
              onPick={pickPreset}
              activeDays={(() => {
                const a = parseISO(draftFrom);
                const b = parseISO(draftTo);
                if (!a || !b) return null;
                const t = parseISO(today);
                if (!t || toISO(t) !== draftTo) return null;
                return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
              })()}
            />

            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                <MonthGrid
                  monthDate={viewMonth}
                  draftFrom={draftFrom}
                  draftTo={draftTo}
                  today={today}
                  onClick={onDayClick}
                  onPrev={() => setViewMonth((m) => addMonths(m, -1))}
                  showPrev
                  showNext={false}
                />
                <MonthGrid
                  monthDate={addMonths(viewMonth, 1)}
                  draftFrom={draftFrom}
                  draftTo={draftTo}
                  today={today}
                  onClick={onDayClick}
                  onNext={() => setViewMonth((m) => addMonths(m, 1))}
                  showPrev={false}
                  showNext
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-(--color-border-soft) pt-3">
                <div className="text-[12px] text-(--color-muted-fg) tabular-nums">
                  {draftFrom && draftTo ? (
                    <>
                      <span className="font-semibold text-(--color-fg)">{fmtShort(draftFrom)}</span>
                      <span className="mx-1.5">→</span>
                      <span className="font-semibold text-(--color-fg)">{fmtShort(draftTo)}</span>
                      <span className="ml-2">
                        ({Math.max(1, Math.round((parseISO(draftTo)!.getTime() - parseISO(draftFrom)!.getTime()) / 86_400_000) + 1)} дн.)
                      </span>
                    </>
                  ) : (
                    <span>Выберите начало и конец периода</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={cancel}
                    className="inline-flex items-center gap-1 h-8 rounded-md px-3 text-[12px] font-medium text-(--color-muted-fg) hover:bg-(--color-muted)"
                  >
                    <X size={13} /> {l.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={apply}
                    disabled={!valid || !dirty}
                    className="inline-flex items-center gap-1 h-8 rounded-md bg-(--color-primary) px-3 text-[12px] font-semibold text-(--color-primary-fg) shadow-[0_2px_8px_rgba(74,101,255,0.25)] hover:bg-(--color-primary-hover) disabled:opacity-40 disabled:shadow-none"
                  >
                    <Check size={13} /> {l.apply}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PresetCol({
  labels,
  onPick,
  activeDays,
}: {
  labels: { k: number; l: string }[];
  onPick: (n: number) => void;
  activeDays: number | null;
}) {
  return (
    <div className="flex w-[110px] flex-col gap-1 border-r border-(--color-border-soft) pr-3">
      {labels.map((p) => (
        <button
          key={p.k}
          type="button"
          onClick={() => onPick(p.k)}
          className={cn(
            'h-8 rounded-md px-2.5 text-left text-[12px] font-medium transition-colors',
            activeDays === p.k
              ? 'bg-(--color-primary-soft) text-(--color-primary-soft-fg)'
              : 'text-(--color-muted-fg) hover:bg-(--color-muted)',
          )}
        >
          {p.l}
        </button>
      ))}
    </div>
  );
}

function MonthGrid({
  monthDate,
  draftFrom,
  draftTo,
  today,
  onClick,
  onPrev,
  onNext,
  showPrev,
  showNext,
}: {
  monthDate: Date;
  draftFrom: string;
  draftTo: string;
  today: string;
  onClick: (iso: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  showPrev: boolean;
  showNext: boolean;
}) {
  const year = monthDate.getFullYear();
  const monthIdx = monthDate.getMonth();
  const total = daysInMonth(year, monthIdx);
  // JS getDay: 0=Sun..6=Sat. Локаль RU: пн=0..вс=6.
  const firstDow = (new Date(year, monthIdx, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        {showPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="rounded-md p-1 text-(--color-muted-fg) hover:bg-(--color-muted)"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft size={14} />
          </button>
        ) : (
          <span className="h-6 w-6" />
        )}
        <div className="text-[13px] font-semibold capitalize">
          {MONTHS_RU[monthIdx]} {year}
        </div>
        {showNext ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-md p-1 text-(--color-muted-fg) hover:bg-(--color-muted)"
            aria-label="Следующий месяц"
          >
            <ChevronRight size={14} />
          </button>
        ) : (
          <span className="h-6 w-6" />
        )}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[11px]">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1 text-center font-medium text-(--color-muted-fg)">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div key={i} className="h-8" />;
          const iso = `${year}-${pad(monthIdx + 1)}-${pad(d)}`;
          const isFuture = iso > today;
          const isStart = iso === draftFrom;
          const isEnd = iso === draftTo;
          const inRange = !!draftFrom && !!draftTo && iso > draftFrom && iso < draftTo;
          const isEdge = isStart || isEnd;
          const isToday = iso === today;

          return (
            <button
              key={i}
              type="button"
              disabled={isFuture}
              onClick={() => onClick(iso)}
              className={cn(
                'h-8 rounded-md text-[12px] font-medium tabular-nums transition-colors',
                isFuture && 'cursor-not-allowed text-(--color-muted-fg)/40',
                !isFuture && !isEdge && !inRange && 'hover:bg-(--color-muted) text-(--color-fg)',
                inRange && 'bg-(--color-primary)/15 text-(--color-fg) rounded-none',
                isStart && draftFrom !== draftTo && 'rounded-r-none',
                isEnd && draftFrom !== draftTo && 'rounded-l-none',
                isEdge &&
                  'bg-(--color-primary) text-(--color-primary-fg) hover:bg-(--color-primary-hover)',
                !isEdge && isToday && 'ring-1 ring-(--color-primary)/40',
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
