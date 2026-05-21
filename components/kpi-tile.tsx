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

export function KpiTile({
  label,
  value,
  hint,
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

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      style={{
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
      }}
      className={cn(
        'group relative rounded-2xl bg-(--color-card) p-5 transition-all hover:shadow-lg w-full text-left',
        interactive &&
          'cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)/30',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11.5px] font-semibold text-(--color-muted-fg) uppercase tracking-[0.08em]">
            {label}
          </div>
          <div className="mt-2.5 text-[30px] font-bold tracking-[-0.025em] text-(--color-fg) num leading-[1.05]">
            {value}
          </div>
          {hint && (
            <div className="mt-2 text-[12.5px] text-(--color-muted-fg) truncate">{hint}</div>
          )}
        </div>
        {Icon && (
          <div className={cn('w-10 h-10 rounded-xl grid place-items-center shrink-0', a.bg)}>
            <Icon size={18} className={a.fg} strokeWidth={2.25} />
          </div>
        )}
      </div>

      {(trend || spark) && (
        <div className="mt-4 flex items-end justify-between gap-3">
          {trend && TrendIcon ? (
            <div
              className={cn(
                'inline-flex items-center gap-1 text-[12px] font-semibold px-1.5 py-0.5 rounded-md',
                trend.value === 0
                  ? 'bg-(--color-muted) text-(--color-muted-fg)'
                  : trendPositive
                  ? 'bg-(--color-success-soft) text-(--color-success)'
                  : 'bg-(--color-danger-soft) text-(--color-danger)',
              )}
            >
              <TrendIcon size={12} strokeWidth={2.5} />
              {trend.value > 0 ? '+' : ''}
              {trend.value.toFixed(1)}%
            </div>
          ) : (
            <div />
          )}
          {spark && spark.length > 1 && (
            <div className="opacity-90">
              <Sparkline data={spark} color={a.chart} width={90} height={28} />
            </div>
          )}
        </div>
      )}
    </Wrapper>
  );
}
