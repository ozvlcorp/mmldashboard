'use client';

import { Search, Bell, Calendar, ChevronDown } from 'lucide-react';
import { useT } from '@/lib/i18n/provider';
import { LanguageSwitcher } from '@/components/language-switcher';

export function Header({
  title,
  subtitle,
  source,
}: {
  title: string;
  subtitle?: string;
  source: 'demo' | 'moysklad' | 'upload';
}) {
  const { t } = useT();
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
              placeholder={t('app.search')}
              className="w-[240px] pl-9 pr-3 h-9 rounded-lg bg-(--color-card) border border-(--color-border) text-[13px] placeholder:text-(--color-muted-fg) focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20 focus:border-(--color-primary)/40"
            />
          </div>

          <button className="h-9 inline-flex items-center gap-2 px-3 rounded-lg bg-(--color-card) border border-(--color-border) text-[13px] font-medium hover:bg-(--color-muted) hover:border-(--color-primary)/40">
            <Calendar size={15} className="text-(--color-muted-fg)" />
            {t('app.period.30d')}
            <ChevronDown size={14} className="text-(--color-muted-fg)" />
          </button>

          <LanguageSwitcher />

          <button className="relative h-9 w-9 grid place-items-center rounded-lg bg-(--color-card) border border-(--color-border) hover:bg-(--color-muted) hover:border-(--color-primary)/40">
            <Bell size={16} className="text-(--color-fg-soft)" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-(--color-danger) ring-2 ring-(--color-card)" />
          </button>

          <div className="ml-1 flex items-center gap-2.5 pl-3 border-l border-(--color-border)">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-(--color-primary) to-(--color-accent-5) grid place-items-center text-white text-[13px] font-bold">
              J
            </div>
            <div className="hidden xl:block leading-tight">
              <div className="text-[13px] font-semibold">Jamshid</div>
              <div className="text-[11px] text-(--color-muted-fg)">{t('app.admin')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
