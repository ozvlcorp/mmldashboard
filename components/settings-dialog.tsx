'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, LogOut, RefreshCw, User2, Calendar, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';

export function SettingsDialog({
  open,
  onOpenChange,
  isLive,
  userName,
  periodDays,
  normDays,
  normDaysAttribute,
  priceTypeName,
  productsCount,
  demandsCount,
  onDisconnect,
  onRefresh,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isLive: boolean;
  userName?: string | null;
  periodDays?: number;
  normDays?: number;
  normDaysAttribute?: string | null;
  priceTypeName?: string | null;
  productsCount?: number;
  demandsCount?: number;
  onDisconnect?: () => void;
  onRefresh?: () => void;
}) {
  const { t } = useT();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm oy-anim-fade" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92%] max-w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-2xl oy-anim-fade">
          <div className="mb-4 flex items-start justify-between gap-3">
            <Dialog.Title className="text-[18px] font-bold tracking-tight">
              {t('settings.title')}
            </Dialog.Title>
            <Dialog.Close
              className="rounded-md p-1 hover:bg-(--color-muted)"
              aria-label="Close"
            >
              <X size={16} className="text-(--color-muted-fg)" />
            </Dialog.Close>
          </div>

          <div className="space-y-3 text-[13px]">
            <Row icon={Database} label={t('settings.connection')}>
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-(--color-success-soft) px-2 py-0.5 text-[11px] font-semibold text-(--color-success)">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {t('app.live')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-(--color-warning-soft) px-2 py-0.5 text-[11px] font-semibold text-(--color-warning)">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {t('app.demo')}
                </span>
              )}
            </Row>

            {isLive && userName && (
              <Row icon={User2} label={t('settings.user')}>
                <span className="font-medium">{userName}</span>
              </Row>
            )}

            {isLive && periodDays != null && (
              <Row icon={Calendar} label={t('settings.period')}>
                <span className="font-medium">{periodDays} дн.</span>
              </Row>
            )}

            {isLive && normDays != null && (
              <Row icon={Calendar} label={t('settings.normDays')}>
                <span className="font-medium">{normDays} дн.</span>
              </Row>
            )}

            {isLive && normDaysAttribute && (
              <Row icon={Database} label={t('settings.normAttr')}>
                <span className="truncate font-medium" title={normDaysAttribute}>
                  {normDaysAttribute}
                </span>
              </Row>
            )}

            {isLive && priceTypeName && (
              <Row icon={Database} label={t('settings.priceType')}>
                <span className="font-medium">{priceTypeName}</span>
              </Row>
            )}

            {isLive && (productsCount != null || demandsCount != null) && (
              <Row icon={Database} label={t('settings.loaded')}>
                <span className="font-medium">
                  {productsCount ?? 0} · {demandsCount ?? 0}
                </span>
              </Row>
            )}
          </div>

          {isLive && (
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-(--color-border-soft) pt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onRefresh?.();
                  onOpenChange(false);
                }}
                disabled={!onRefresh}
              >
                <RefreshCw size={13} />
                {t('app.refresh')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  onDisconnect?.();
                  onOpenChange(false);
                }}
                disabled={!onDisconnect}
              >
                <LogOut size={13} />
                {t('connect.disconnect')}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User2;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-(--color-muted)/40 px-3 py-2">
      <span className="flex items-center gap-2 text-(--color-muted-fg)">
        <Icon size={14} />
        {label}
      </span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  );
}
