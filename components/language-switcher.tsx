'use client';

import * as React from 'react';
import { Languages, Check } from 'lucide-react';
import { useT } from '@/lib/i18n/provider';
import { langs, type Lang } from '@/lib/i18n/dict';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { lang, setLang } = useT();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const current = langs.find((l) => l.code === lang) ?? langs[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-9 inline-flex items-center gap-2 px-3 rounded-lg bg-(--color-card) border border-(--color-border) text-[13px] font-medium hover:bg-(--color-muted) transition-all hover:border-(--color-primary)/40"
      >
        <Languages size={15} className="text-(--color-muted-fg)" />
        <span className="text-base leading-none">{current.flag}</span>
        <span className="uppercase tracking-wider text-[11px] font-semibold text-(--color-muted-fg)">
          {current.code}
        </span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 z-50 min-w-[180px] rounded-xl bg-(--color-card) border border-(--color-border) shadow-popover overflow-hidden animate-in fade-in slide-in-from-top-1">
          {langs.map((l) => {
            const active = l.code === lang;
            return (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code as Lang);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-[13px] hover:bg-(--color-muted) transition-colors',
                  active && 'bg-(--color-primary-soft)/50',
                )}
              >
                <span className="text-lg leading-none">{l.flag}</span>
                <span className="flex-1 text-left font-medium">{l.label}</span>
                {active && <Check size={14} className="text-(--color-primary)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
