'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import type { ConnectParams } from '@/lib/moysklad/browser';

export type { ConnectParams } from '@/lib/moysklad/browser';

export function ConnectDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  progressLabel,
  error,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (token: string, params: ConnectParams) => void;
  loading: boolean;
  progressLabel: string | null;
  error: string | null;
}) {
  const { t } = useT();
  const today = React.useMemo(() => toISODate(new Date()), []);
  const monthAgo = React.useMemo(
    () => toISODate(new Date(Date.now() - 30 * 86400000)),
    [],
  );
  const [token, setToken] = React.useState('');
  const [fromDate, setFromDate] = React.useState(monthAgo);
  const [toDate, setToDate] = React.useState(today);
  const [normDays, setNormDays] = React.useState(10);
  const [normDaysAttribute, setNormDaysAttribute] = React.useState('');
  const [priceTypeName, setPriceTypeName] = React.useState('');

  const periodDays = Math.max(
    1,
    Math.round(
      (new Date(toDate + 'T23:59:59').getTime() -
        new Date(fromDate + 'T00:00:00').getTime()) /
        86400000,
    ),
  );
  const rangeValid = !!fromDate && !!toDate && fromDate <= toDate;

  React.useEffect(() => {
    if (!open) setToken('');
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rangeValid) return;
    onSubmit(token.trim(), {
      periodDays,
      normDays,
      normDaysAttribute: normDaysAttribute.trim() || undefined,
      priceTypeName: priceTypeName.trim() || undefined,
      fromDate,
      toDate,
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm oy-anim-fade" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-2xl oy-anim-fade">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Dialog.Title className="flex items-center gap-2 text-[18px] font-bold tracking-tight">
                <Link2 size={18} className="text-(--color-primary)" />
                {t('connect.title')}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[12px] text-(--color-muted-fg)">
                {t('connect.subtitle')}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-md p-1 hover:bg-(--color-muted) disabled:opacity-50"
              aria-label="Close"
              disabled={loading}
            >
              <X size={16} className="text-(--color-muted-fg)" />
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <Field label={t('connect.token')} hint={t('connect.tokenHint')}>
              <textarea
                required
                rows={3}
                value={token}
                disabled={loading}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOi…"
                className="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 font-mono text-[12px] leading-snug focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20 disabled:opacity-60"
              />
            </Field>

            <Field label={t('connect.period')} hint={t('connect.periodHint', { days: periodDays })}>
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-(--color-muted-fg)">{t('connect.from')}</span>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate || today}
                    disabled={loading}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-9 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20 disabled:opacity-60"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-(--color-muted-fg)">{t('connect.to')}</span>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    max={today}
                    disabled={loading}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-9 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20 disabled:opacity-60"
                  />
                </label>
              </div>
              {!rangeValid && (
                <div className="mt-1 text-[11px] text-rose-600">{t('connect.rangeError')}</div>
              )}
            </Field>

            <Field label={t('connect.normDays')}>
              <input
                type="number"
                min={1}
                max={365}
                value={normDays}
                disabled={loading}
                onChange={(e) => setNormDays(Number(e.target.value))}
                className="h-9 w-32 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20 disabled:opacity-60"
              />
            </Field>

            <Field label={t('connect.normDaysAttribute')} hint={t('connect.normDaysAttributeHint')}>
              <input
                type="text"
                value={normDaysAttribute}
                disabled={loading}
                onChange={(e) => setNormDaysAttribute(e.target.value)}
                placeholder="Норматив запаса (дни)"
                className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20 disabled:opacity-60"
              />
            </Field>

            <Field label={t('connect.priceType')} hint={t('connect.priceTypeHint')}>
              <input
                type="text"
                value={priceTypeName}
                disabled={loading}
                onChange={(e) => setPriceTypeName(e.target.value)}
                placeholder="Закупочная цена"
                className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20 disabled:opacity-60"
              />
            </Field>

            {progressLabel && (
              <div className="flex items-center gap-2 rounded-md border border-(--color-primary)/30 bg-(--color-primary-soft) px-3 py-2 text-[12px] text-(--color-primary-soft-fg)">
                <Loader2 size={13} className="animate-spin" />
                {progressLabel}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-rose-300/50 bg-rose-50/70 px-3 py-2 text-[12px] text-rose-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                {t('connect.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading || token.trim().length < 10 || !rangeValid}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? t('connect.loading') : t('connect.submit')}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12px] font-semibold text-(--color-fg)">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[11px] text-(--color-muted-fg)">{hint}</div>}
    </label>
  );
}
