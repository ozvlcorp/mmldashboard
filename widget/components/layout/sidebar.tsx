'use client';

import {
  Package,
  BarChart3,
  TrendingUp,
  Users,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/provider';
import type { DictKey } from '@/lib/i18n/dict';

export type NavKey = 'inventory' | 'abc' | 'xyz' | 'rfm' | 'debts' | 'ai';

type NavItem = {
  key: NavKey;
  label: DictKey;
  icon: typeof Package;
  badge?: string;
};

const navGroups: { label: DictKey; items: NavItem[] }[] = [
  {
    label: 'nav.section.analytics',
    items: [
      { key: 'inventory', label: 'nav.inventory', icon: Package },
      { key: 'abc', label: 'nav.abc', icon: BarChart3 },
      { key: 'xyz', label: 'nav.xyz', icon: TrendingUp },
      { key: 'rfm', label: 'nav.rfm', icon: Users },
    ],
  },
  {
    label: 'nav.section.ops',
    items: [{ key: 'debts', label: 'nav.debts', icon: Wallet, badge: '4' }],
  },
  {
    label: 'nav.section.assistant',
    items: [{ key: 'ai', label: 'nav.ai', icon: Sparkles }],
  },
];

export function Sidebar({
  active,
  onSelect,
  onOpenSettings,
  onOpenHelp,
  onLogout,
  debtorsBadge,
}: {
  active: NavKey;
  onSelect: (key: NavKey) => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onLogout?: () => void;
  debtorsBadge?: string;
}) {
  const { t } = useT();
  const groups: typeof navGroups = navGroups.map((g) => ({
    ...g,
    items: g.items.map((it) =>
      it.key === 'debts' ? { ...it, badge: debtorsBadge ?? it.badge } : it,
    ),
  }));
  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 bg-white border-r border-(--color-border) px-4 py-5">
      <div className="flex items-center gap-2.5 px-2 mb-7 oy-anim-fade">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-(--color-primary) to-(--color-accent-5) p-2 shadow-[0_4px_12px_rgba(74,101,255,0.35)] text-white">
          <svg viewBox="0 0 375 375" className="w-full h-full" fill="currentColor" aria-hidden="true">
            <defs>
              <clipPath id="oy-o">
                <path d="M 122.5 103 C 75.5 103 37.5 140.6 37.5 187 C 37.5 233 75.5 270.7 122.5 270.7 C 169.4 270.7 207.5 233 207.5 187 C 207.5 140.6 169.4 103 122.5 103 Z" />
              </clipPath>
            </defs>
            <g clipPath="url(#oy-o)">
              <rect x="37" y="103" width="171" height="168" />
            </g>
            <g transform="translate(203 270.7)">
              <path d="M 69.3 0 C 66.1 0 63.5 -1.1 61.3 -3.3 C 59.1 -5.5 58 -8.2 58 -11.5 L 58 -60.9 C 51.2 -62 44.8 -64.2 38.9 -67.5 C 33 -70.8 27.8 -75 23.3 -80.1 C 18.8 -85.1 15.3 -90.8 12.7 -97.2 C 10.2 -103.6 8.8 -110.3 8.5 -117.3 L 8.5 -156.8 C 8.5 -159.9 9.7 -162.6 12 -164.7 C 14.2 -166.9 16.8 -168 19.9 -168 C 23.1 -168 25.8 -166.9 27.9 -164.8 C 30 -162.6 31.1 -159.9 31.1 -156.8 L 31.1 -118.7 C 31.1 -113.7 32 -109 33.8 -104.5 C 35.6 -100.1 38.2 -96.1 41.5 -92.7 C 44.8 -89.3 48.7 -86.6 53.1 -84.6 C 57.5 -82.7 62.2 -81.8 67.3 -81.8 C 72.3 -81.8 76.9 -82.7 81.3 -84.5 C 85.6 -86.3 89.4 -88.9 92.6 -92.3 C 95.8 -95.8 98.3 -99.7 100.1 -104.1 C 101.9 -108.5 102.8 -113.2 102.9 -118.2 L 102.9 -156.8 C 102.9 -159.9 104 -162.6 106.2 -164.8 C 108.4 -166.9 111.1 -168 114.3 -168 C 117.5 -168 120.1 -166.9 122.2 -164.8 C 124.3 -162.6 125.3 -159.9 125.3 -156.8 L 125.3 -119.9 C 125.3 -112.8 124.3 -106.1 122.1 -99.7 C 119.9 -93.3 116.8 -87.5 112.9 -82.3 C 108.9 -77.1 104.1 -72.7 98.6 -69.2 C 93.1 -65.6 87 -63 80.5 -61.5 L 80.5 -11.5 C 80.5 -8.2 79.4 -5.5 77.2 -3.3 C 75 -1.1 72.3 0 69.3 0 Z" />
            </g>
          </svg>
        </div>
        <div>
          <div className="text-[15px] font-bold text-(--color-fg) leading-tight tracking-tight">
            {t('app.brand')}
          </div>
          <div className="text-[11px] text-(--color-muted-fg) leading-tight">
            {t('app.subbrand')}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin -mx-2 px-2">
        {groups.map((group, gi) => (
          <div key={group.label} className={cn('mb-5 oy-anim-fade', `oy-stagger-${gi + 1}`)}>
            <div className="px-3 mb-1.5 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-(--color-muted-fg)">
              {t(group.label)}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <li key={item.key}>
                    <button
                      onClick={() => onSelect(item.key)}
                      className={cn(
                        'group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium',
                        isActive
                          ? 'bg-[#ecefff] text-(--color-primary-soft-fg) shadow-[0_1px_0_rgba(74,101,255,0.08)]'
                          : 'text-(--color-fg-soft) hover:bg-(--color-muted) hover:translate-x-[1px]',
                      )}
                    >
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.25 : 1.75}
                        className={cn(
                          'transition-transform',
                          isActive ? 'text-(--color-primary)' : 'text-(--color-muted-fg) group-hover:scale-110',
                        )}
                      />
                      <span className="flex-1 text-left">{t(item.label)}</span>
                      {item.badge && (
                        <span
                          className={cn(
                            'min-w-[20px] h-[20px] px-1.5 rounded-md text-[10px] font-semibold grid place-items-center',
                            isActive
                              ? 'bg-(--color-primary) text-white'
                              : 'bg-(--color-danger-soft) text-(--color-danger)',
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 pt-4 border-t border-(--color-border-soft) -mx-2 px-2">
        <button
          onClick={onOpenSettings}
          disabled={!onOpenSettings}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-(--color-fg-soft) hover:bg-(--color-muted) disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <Settings size={18} strokeWidth={1.75} className="text-(--color-muted-fg)" />
          {t('nav.settings')}
        </button>
        <button
          onClick={onOpenHelp}
          disabled={!onOpenHelp}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-(--color-fg-soft) hover:bg-(--color-muted) disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <HelpCircle size={18} strokeWidth={1.75} className="text-(--color-muted-fg)" />
          {t('nav.help')}
        </button>
        <button
          onClick={onLogout}
          disabled={!onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-(--color-danger) hover:bg-(--color-danger-soft) disabled:opacity-50 disabled:hover:bg-transparent"
        >
          <LogOut size={18} strokeWidth={1.75} />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
