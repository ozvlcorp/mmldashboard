'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import type { InventoryInput } from '@/lib/analytics/inventory';
import type { AbcInput } from '@/lib/analytics/abc';
import type { XyzInput } from '@/lib/analytics/xyz';
import type { RfmTransaction } from '@/lib/analytics/rfm';

export type LoadedData = {
  inventory: InventoryInput[];
  abc: AbcInput[];
  xyz: XyzInput[];
  rfm: RfmTransaction[];
  meta: {
    periodDays: number;
    from: string;
    to: string;
    productsCount: number;
    demandsCount: number;
  };
};

export type ConnectParams = {
  periodDays: number;
  normDays: number;
  normDaysAttribute?: string;
  priceTypeName?: string;
};

export function ConnectDialog({
  open,
  onOpenChange,
  onLoaded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLoaded: (token: string, params: ConnectParams, data: LoadedData) => void;
}) {
  const { t } = useT();
  const [token, setToken] = React.useState('');
  const [periodDays, setPeriodDays] = React.useState(30);
  const [normDays, setNormDays] = React.useState(10);
  const [normDaysAttribute, setNormDaysAttribute] = React.useState('');
  const [priceTypeName, setPriceTypeName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setToken('');
      setError(null);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const params: ConnectParams = {
      periodDays,
      normDays,
      normDaysAttribute: normDaysAttribute.trim() || undefined,
      priceTypeName: priceTypeName.trim() || undefined,
    };
    try {
      const res = await fetch('/api/moysklad/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), ...params }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || `HTTP ${res.status}`);
      }
      onLoaded(token.trim(), params, data as LoadedData);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
            <Dialog.Close className="rounded-md p-1 hover:bg-(--color-muted)" aria-label="Close">
              <X size={16} className="text-(--color-muted-fg)" />
            </Dialog.Close>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <Field label={t('connect.token')} hint={t('connect.tokenHint')}>
              <textarea
                required
                rows={3}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="eyJhbGciOi…"
                className="w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 py-2 font-mono text-[12px] leading-snug focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('connect.periodDays')}>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={periodDays}
                  onChange={(e) => setPeriodDays(Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20"
                />
              </Field>
              <Field label={t('connect.normDays')}>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={normDays}
                  onChange={(e) => setNormDays(Number(e.target.value))}
                  className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20"
                />
              </Field>
            </div>

            <Field label={t('connect.normDaysAttribute')} hint={t('connect.normDaysAttributeHint')}>
              <input
                type="text"
                value={normDaysAttribute}
                onChange={(e) => setNormDaysAttribute(e.target.value)}
                placeholder="Норматив запаса (дни)"
                className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20"
              />
            </Field>

            <Field label={t('connect.priceType')} hint={t('connect.priceTypeHint')}>
              <input
                type="text"
                value={priceTypeName}
                onChange={(e) => setPriceTypeName(e.target.value)}
                placeholder="Закупочная цена"
                className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20"
              />
            </Field>

            {error && (
              <div className="rounded-md border border-rose-300/50 bg-rose-50/70 px-3 py-2 text-[12px] text-rose-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {t('connect.cancel')}
              </Button>
              <Button type="submit" disabled={loading || token.trim().length < 10}>
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
