'use client';

import { Search, Calendar, ChevronDown, X } from 'lucide-react';
import { useT } from '@/lib/i18n/provider';
import { LanguageSwitcher } from '@/components/language-switcher';

const PERIOD_OPTIONS = [7, 14, 30, 60, 90, 180, 365];

export function Header({
  title,
  subtitle,
  source,
  periodDays,
  onChangePeriod,
  userName,
  userRole,
  searchQuery = '',
  onChangeSearch,
}: {
  title: string;
  subtitle?: string;
  source: 'demo' | 'moysklad' | 'upload';
  periodDays?: number;
  onChangePeriod?: (d: number) => void;
  userName?: string;
  userRole?: string;
  searchQuery?: string;
  onChangeSearch?: (v: string) => void;
}) {
  const { t } = useT();
  const periodLabel = periodDays ? `${periodDays} дн.` : t('app.period.30d');
  const interactive = !!onChangePeriod && !!periodDays;
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

          <div className="relative">
            <button
              type="button"
              disabled={!interactive}
              className={
                'h-9 inline-flex items-center gap-2 px-3 rounded-lg bg-(--color-card) border border-(--color-border) text-[13px] font-medium ' +
                (interactive
                  ? 'hover:bg-(--color-muted) hover:border-(--color-primary)/40 cursor-pointer'
                  : 'opacity-70 cursor-default')
              }
            >
              <Calendar size={15} className="text-(--color-muted-fg)" />
              {periodLabel}
              <ChevronDown size={14} className="text-(--color-muted-fg)" />
            </button>
            {interactive && (
              <select
                aria-label={t('app.period.30d')}
                value={periodDays}
                onChange={(e) => onChangePeriod!(Number(e.target.value))}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {PERIOD_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} дн.
                  </option>
                ))}
              </select>
            )}
          </div>

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
