'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Package, BarChart3, TrendingUp, Users, Wallet } from 'lucide-react';
import { useT } from '@/lib/i18n/provider';

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useT();

  const sections = [
    {
      icon: Package,
      title: t('help.inventory.title'),
      text: t('help.inventory.text'),
    },
    {
      icon: BarChart3,
      title: t('help.abc.title'),
      text: t('help.abc.text'),
    },
    {
      icon: TrendingUp,
      title: t('help.xyz.title'),
      text: t('help.xyz.text'),
    },
    {
      icon: Users,
      title: t('help.rfm.title'),
      text: t('help.rfm.text'),
    },
    {
      icon: Wallet,
      title: t('help.debts.title'),
      text: t('help.debts.text'),
    },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm oy-anim-fade" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92%] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-2xl oy-anim-fade">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-[18px] font-bold tracking-tight">
                {t('help.title')}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[12px] text-(--color-muted-fg)">
                {t('help.subtitle')}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="rounded-md p-1 hover:bg-(--color-muted)"
              aria-label="Close"
            >
              <X size={16} className="text-(--color-muted-fg)" />
            </Dialog.Close>
          </div>

          <div className="space-y-3">
            {sections.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-(--color-border-soft) bg-(--color-muted)/30 p-3"
              >
                <div className="flex items-center gap-2 text-[13px] font-semibold">
                  <s.icon size={15} className="text-(--color-primary)" />
                  {s.title}
                </div>
                <p className="mt-1 text-[12px] leading-snug text-(--color-muted-fg)">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
