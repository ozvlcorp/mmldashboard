import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from '@/components/sparkline';
import { cn } from '@/lib/utils';

export type KpiAccent = 'indigo' | 'amber' | 'emerald' | 'rose' | 'violet' | 'cyan';

const accentClasses: Record<KpiAccent, { bg: string; fg: string; chart: string }> = {
  indigo: { bg: 'bg-[#ecefff]', fg: 'text-[#4a65ff]', chart: '#4a65ff' },
  amber: { bg: 'bg-[#fef3c7]', fg: 'text-[#d97706]', chart: '#f59e0b' },
  emerald: { bg: 'bg-[#d1fae5]', fg: 'text-[#059669]', chart: '#10b981' },
  rose: { bg: 'bg-[#fee2e2]', fg: 'text-[#dc2626]', chart: '#ef4444' },
  violet: { bg: 'bg-[#ede9fe]', fg: 'text-[#7c3aed]', chart: '#8b5cf6' },
  cyan: { bg: 'bg-[#cffafe]', fg: 'text-[#0891b2]', chart: '#06b6d4' },
};

// Подбираем размер шрифта по длине значения чтобы оно влезало в одну
// строку — иначе на узких плитках (xl: 6 колонок ≈ 200px) длинные числа
// типа "$ 438 223 521" переносятся и плитки получаются разной высоты.
function valueFontClass(value: string): string {
  const len = value.length;
  if (len <= 7) return 'text-[28px]';
  if (len <= 10) return 'text-[24px]';
  if (len <= 13) return 'text-[20px]';
  if (len <= 16) return 'text-[18px]';
  return 'text-[16px]';
}

export function KpiTile({
  label,
  value,
  hint,
  tooltip,
  advice,
  icon: Icon,
  trend,
  spark,
  accent = 'indigo',
  className,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  tooltip?: string;
  advice?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive?: boolean };
  spark?: number[];
  accent?: KpiAccent;
  className?: string;
  onClick?: () => void;
}) {
  const a = accentClasses[accent];
  const trendPositive = trend ? trend.positive ?? trend.value > 0 : undefined;
  const TrendIcon =
    trend == null ? null : trend.value === 0 ? Minus : trendPositive ? TrendingUp : TrendingDown;

  const interactive = !!onClick;
  const Wrapper = interactive ? 'button' : 'div';
  const titleText = [tooltip, advice && `💡 ${advice}`].filter(Boolean).join('\n');

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      style={{
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      }}
      title={titleText || undefined}
      className={cn(
        // h-full + flex-col → одна высота в grid-cell; min-h гарантирует ровную сетку
        'group relative h-full flex flex-col rounded-2xl bg-(--color-card) p-4 transition-all hover:shadow-lg w-full text-left border-2 border-transparent min-h-[160px]',
        interactive &&
          'cursor-pointer hover:border-(--color-primary)/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-(--color-muted-fg) uppercase tracking-[0.08em] truncate">
            {label}
          </div>
          <div
            className={cn(
              'mt-2 font-bold tracking-[-0.02em] text-(--color-fg) tabular-nums leading-[1.1] whitespace-nowrap overflow-hidden',
              valueFontClass(value),
            )}
          >
            {value}
          </div>
          {hint && (
            <div className="mt-1.5 text-[11.5px] text-(--color-muted-fg) line-clamp-2 leading-snug">
              {hint}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('w-9 h-9 rounded-xl grid place-items-center shrink-0', a.bg)}>
            <Icon size={17} className={a.fg} strokeWidth={2.25} />
          </div>
        )}
      </div>

      {/* spark/trend всегда внизу (mt-auto) и одинаковой высоты — синхронный ритм во всём ряду */}
      <div className="mt-auto pt-3 flex items-end justify-between gap-2 min-h-[34px]">
        {trend && TrendIcon ? (
          <div
            className={cn(
              'inline-flex items-center gap-1 text-[11.5px] font-semibold px-1.5 py-0.5 rounded-md',
              trend.value === 0
                ? 'bg-(--color-muted) text-(--color-muted-fg)'
                : trendPositive
                ? 'bg-(--color-success-soft) text-(--color-success)'
                : 'bg-(--color-danger-soft) text-(--color-danger)',
            )}
          >
            <TrendIcon size={11} strokeWidth={2.5} />
            {trend.value > 0 ? '+' : ''}
            {trend.value.toFixed(1)}%
          </div>
        ) : (
          <span />
        )}
        {spark && spark.length > 1 ? (
          <Sparkline data={spark} color={a.chart} width={80} height={24} />
        ) : (
          <span />
        )}
      </div>
    </Wrapper>
  );
}
