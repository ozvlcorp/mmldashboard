import { cn } from '@/lib/utils';

const colors: Record<string, string> = {
  A: 'bg-[#dcfce7] text-[#15803d]',
  B: 'bg-[#fef3c7] text-[#a16207]',
  C: 'bg-[#fee2e2] text-[#b91c1c]',
  X: 'bg-[#dbeafe] text-[#1e40af]',
  Y: 'bg-[#ede9fe] text-[#6d28d9]',
  Z: 'bg-[#ffedd5] text-[#c2410c]',
  success: 'bg-(--color-success-soft) text-(--color-success)',
  warning: 'bg-(--color-warning-soft) text-(--color-warning)',
  danger: 'bg-(--color-danger-soft) text-(--color-danger)',
  info: 'bg-(--color-info-soft) text-(--color-info)',
  muted: 'bg-(--color-muted) text-(--color-muted-fg)',
  primary: 'bg-(--color-primary-soft) text-(--color-primary-soft-fg)',
};

export function Badge({
  variant = 'muted',
  className,
  ...p
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof colors | string }) {
  return (
    <span
      {...p}
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        colors[variant] ?? colors.muted,
        className,
      )}
    />
  );
}
