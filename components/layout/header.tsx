'use client';

import * as React from 'react';
import { Search, Calendar, X, Warehouse, Clock } from 'lucide-react';
import { useT } from '@/lib/i18n/provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import { DateRangePopover } from '@/components/date-range-popover';

export function Header({
  title,
  subtitle,
  source,
  fromDate,
  toDate,
  onChangePeriod,
  stores,
  storeId,
  onChangeStore,
  horizonDays,
  onChangeHorizon,
  userName,
  userRole,
  searchQuery = '',
  onChangeSearch,
}: {
  title: string;
  subtitle?: string;
  source: 'demo' | 'moysklad' | 'upload';
  fromDate?: string;
  toDate?: string;
  onChangePeriod?: (from: string, to: string) => void;
  stores?: { id: string; name: string }[];
  storeId?: string;
  onChangeStore?: (id: string) => void;
  /** Горизонт расчёта потенциальной/фактической прибыли в днях. */
  horizonDays?: number;
  /** Обработчик смены горизонта. Если не передан — контрол не показывается. */
  onChangeHorizon?: (n: number) => void;
  userName?: string;
  userRole?: string;
  searchQuery?: string;
  onChangeSearch?: (v: string) => void;
}) {
  const { t } = useT();
  const today = toISODate(new Date());
  const interactive = !!onChangePeriod && !!fromDate && !!toDate;
  const displayName = userName || 'Jamshid';
  const displayInitial = displayName.charAt(0).toUpperCase() || 'J';

  return (
    <div className="sticky top-0 z-30 bg-(--color-bg)/85 backdrop-blur-md border-b border-(--color-border)">
      <div className="px-6 lg:px-8 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0 oy-anim-fade">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold tracking-tight text-(--color-fg)">{title}</h1>
            <span
              className={
                source === 'moysklad'
                  ? 'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md bg-(--color-success-soft) text-(--color-success)'
                  : 'inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md bg-(--color-warning-soft) text-(--color-warning)'
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {source === 'moysklad' ? t('app.live') : t('app.demo')}
            </span>
          </div>
          {subtitle && (
            <p className="text-[13px] text-(--color-muted-fg) mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 oy-anim-slide">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted-fg)"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onChangeSearch?.(e.target.value)}
              placeholder={t('app.search')}
              className="w-[240px] pl-9 pr-8 h-9 rounded-lg bg-(--color-card) border border-(--color-border) text-[13px] placeholder:text-(--color-muted-fg) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20 focus:border-(--color-primary)/40"
            />
            {searchQuery && onChangeSearch && (
              <button
                type="button"
                onClick={() => onChangeSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-(--color-muted-fg) hover:bg-(--color-muted)"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {interactive ? (
            <DateRangePopover
              from={fromDate!}
              to={toDate!}
              maxDate={today}
              onApply={(f, t) => onChangePeriod!(f, t)}
            />
          ) : (
            <div className="h-9 inline-flex items-center gap-2 px-3 rounded-lg bg-(--color-card) border border-(--color-border) text-[13px] font-medium opacity-70">
              <Calendar size={15} className="text-(--color-muted-fg)" />
              {t('app.period.30d')}
            </div>
          )}

          {onChangeHorizon && horizonDays != null && (
            <HorizonInput value={horizonDays} onChange={onChangeHorizon} />
          )}

          {onChangeStore && stores && stores.length > 1 && (
            <label className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-(--color-border) bg-(--color-card) px-2 text-[12px]">
              <Warehouse size={14} className="text-(--color-muted-fg)" />
              <select
                value={storeId ?? ''}
                onChange={(e) => onChangeStore(e.target.value)}
                aria-label="Склад"
                className="bg-transparent text-[12px] focus:outline-none max-w-[180px]"
              >
                <option value="">Все склады</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <LanguageSwitcher />

          <div className="ml-1 flex items-center gap-2.5 pl-3 border-l border-(--color-border)">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-(--color-primary) to-(--color-accent-5) grid place-items-center text-white text-[13px] font-bold">
              {displayInitial}
            </div>
            <div className="hidden xl:block leading-tight max-w-[160px]">
              <div className="text-[13px] font-semibold truncate" title={displayName}>
                {displayName}
              </div>
              <div className="text-[11px] text-(--color-muted-fg) truncate">
                {userRole ?? t('app.admin')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HorizonInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = React.useState(String(value));
  React.useEffect(() => setDraft(String(value)), [value]);
  const commit = () => {
    const n = Math.max(1, Math.min(365, parseInt(draft, 10) || value));
    if (n !== value) onChange(n);
    setDraft(String(n));
  };
  return (
    <label
      className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-(--color-border) bg-(--color-card) px-2.5 text-[12px]"
      title="Горизонт расчёта прибыли в днях"
    >
      <Clock size={14} className="text-(--color-muted-fg)" />
      <input
        type="number"
        min={1}
        max={365}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        className="w-12 bg-transparent text-[12px] tabular-nums focus:outline-none text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Горизонт, дней"
      />
      <span className="text-(--color-muted-fg)">дн.</span>
    </label>
  );
}

function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
