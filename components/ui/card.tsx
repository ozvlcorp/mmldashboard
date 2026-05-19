import { cn } from '@/lib/utils';

export function Card({ className, style, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...p}
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)', ...style }}
      className={cn(
        'rounded-2xl bg-(--color-card) overflow-hidden',
        className,
      )}
    />
  );
}

export function CardHeader({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...p}
      className={cn(
        'px-6 pt-6 pb-4 flex flex-col gap-1 border-b border-(--color-border-soft)',
        className,
      )}
    />
  );
}

export function CardTitle({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 {...p} className={cn('text-[16px] font-bold tracking-tight', className)} />;
}

export function CardDescription({
  className,
  ...p
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...p} className={cn('text-[13px] text-(--color-muted-fg) leading-snug', className)} />
  );
}

export function CardContent({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p} className={cn('px-6 py-5', className)} />;
}
