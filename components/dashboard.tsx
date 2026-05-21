'use client';

import { useState } from 'react';
import { Sidebar, type NavKey } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { InventoryView } from '@/components/views/inventory-view';
import { AbcView } from '@/components/views/abc-view';
import { XyzView } from '@/components/views/xyz-view';
import { RfmView } from '@/components/views/rfm-view';
import { DebtsView } from '@/components/views/debts-view';
import { useT } from '@/lib/i18n/provider';
import type { DictKey } from '@/lib/i18n/dict';
import type { InventoryInput } from '@/lib/analytics/inventory';
import type { AbcInput } from '@/lib/analytics/abc';
import type { XyzInput } from '@/lib/analytics/xyz';
import type { RfmTransaction } from '@/lib/analytics/rfm';
import type { DebtCandidate } from '@/lib/moysklad/debts';

const pageMeta: Record<NavKey, { title: DictKey; subtitle: DictKey }> = {
  inventory: { title: 'page.inventory.title', subtitle: 'page.inventory.subtitle' },
  abc: { title: 'page.abc.title', subtitle: 'page.abc.subtitle' },
  xyz: { title: 'page.xyz.title', subtitle: 'page.xyz.subtitle' },
  rfm: { title: 'page.rfm.title', subtitle: 'page.rfm.subtitle' },
  debts: { title: 'page.debts.title', subtitle: 'page.debts.subtitle' },
};

export function Dashboard({
  inventory,
  abc,
  xyz,
  rfm,
  debtors,
  source,
  currency = 'сум',
  horizonDays = 10,
  onScanDebtors,
  debtorsScanning,
  debtorsProgress,
  debtorsError,
}: {
  inventory: InventoryInput[];
  abc: AbcInput[];
  xyz: XyzInput[];
  rfm: RfmTransaction[];
  debtors: DebtCandidate[];
  source: 'demo' | 'moysklad' | 'upload';
  currency?: string;
  horizonDays?: number;
  onScanDebtors?: () => void;
  debtorsScanning?: boolean;
  debtorsProgress?: string | null;
  debtorsError?: string | null;
}) {
  const [active, setActive] = useState<NavKey>('inventory');
  const { t, lang, nonce } = useT();
  const meta = pageMeta[active];

  return (
    <div className="flex min-h-screen bg-(--color-bg)" key={`${lang}-${nonce}`}>
      <Sidebar active={active} onSelect={setActive} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header title={t(meta.title)} subtitle={t(meta.subtitle)} source={source} />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          <div key={active} className="oy-anim-page">
            {active === 'inventory' && (
              <InventoryView inputs={inventory} horizonDays={horizonDays} currency={currency} />
            )}
            {active === 'abc' && <AbcView inputs={abc} currency={currency} />}
            {active === 'xyz' && <XyzView inputs={xyz} />}
            {active === 'rfm' && <RfmView transactions={rfm} currency={currency} />}
            {active === 'debts' && (
              <DebtsView
                initialDebtors={debtors}
                currency={currency}
                onScan={onScanDebtors}
                scanning={debtorsScanning}
                scanProgress={debtorsProgress}
                scanError={debtorsError}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
