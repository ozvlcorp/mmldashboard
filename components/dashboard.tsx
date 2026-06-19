'use client';

import { useState } from 'react';
import { Sidebar, type NavKey } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { InventoryView } from '@/components/views/inventory-view';
import { AbcView } from '@/components/views/abc-view';
import { XyzView } from '@/components/views/xyz-view';
import { RfmView } from '@/components/views/rfm-view';
import { DebtsView } from '@/components/views/debts-view';
import { AiView } from '@/components/views/ai-view';
import { useT } from '@/lib/i18n/provider';
import type { DictKey } from '@/lib/i18n/dict';
import type { InventoryInput } from '@/lib/analytics/inventory';
import type { AbcInput } from '@/lib/analytics/abc';
import type { XyzInput } from '@/lib/analytics/xyz';
import type { RfmTransaction } from '@/lib/analytics/rfm';
import type { DebtCandidate } from '@/lib/moysklad/debts';

type CreateTaskFn = (d: DebtCandidate) => Promise<{ taskId: string }>;

const pageMeta: Record<NavKey, { title: DictKey; subtitle: DictKey }> = {
  inventory: { title: 'page.inventory.title', subtitle: 'page.inventory.subtitle' },
  abc: { title: 'page.abc.title', subtitle: 'page.abc.subtitle' },
  xyz: { title: 'page.xyz.title', subtitle: 'page.xyz.subtitle' },
  rfm: { title: 'page.rfm.title', subtitle: 'page.rfm.subtitle' },
  debts: { title: 'page.debts.title', subtitle: 'page.debts.subtitle' },
  ai: { title: 'page.ai.title', subtitle: 'page.ai.subtitle' },
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
  onChangeHorizon,
  debtorGroups,
  onScanDebtors,
  debtorsScanning,
  debtorsProgress,
  debtorsError,
  onCreateDebtorTask,
  assigneeName,
  fromDate,
  toDate,
  onChangePeriod,
  stores,
  storeId,
  onChangeStore,
  userName,
  searchQuery,
  onChangeSearch,
  onOpenSettings,
  onOpenHelp,
  onLogout,
  debtorsBadge,
  turnoverTrend,
  aiContext,
}: {
  inventory: InventoryInput[];
  abc: AbcInput[];
  xyz: XyzInput[];
  rfm: RfmTransaction[];
  debtors: DebtCandidate[];
  debtorGroups?: { id: string; name: string }[];
  source: 'demo' | 'moysklad' | 'upload';
  currency?: string;
  horizonDays?: number;
  onChangeHorizon?: (n: number) => void;
  onScanDebtors?: () => void;
  debtorsScanning?: boolean;
  debtorsProgress?: string | null;
  debtorsError?: string | null;
  onCreateDebtorTask?: CreateTaskFn;
  assigneeName?: string | null;
  fromDate?: string;
  toDate?: string;
  onChangePeriod?: (from: string, to: string) => void;
  stores?: { id: string; name: string }[];
  storeId?: string;
  onChangeStore?: (id: string) => void;
  userName?: string | null;
  searchQuery?: string;
  onChangeSearch?: (v: string) => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  onLogout?: () => void;
  debtorsBadge?: string;
  turnoverTrend?: { value: number; positive?: boolean };
  aiContext?: unknown;
}) {
  const [active, setActive] = useState<NavKey>('inventory');
  const { t, lang, nonce } = useT();
  const meta = pageMeta[active];

  return (
    <div className="flex min-h-screen bg-(--color-bg)" key={`${lang}-${nonce}`}>
      <Sidebar
        active={active}
        onSelect={setActive}
        onOpenSettings={onOpenSettings}
        onOpenHelp={onOpenHelp}
        onLogout={onLogout}
        debtorsBadge={debtorsBadge}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header
          title={t(meta.title)}
          subtitle={t(meta.subtitle)}
          source={source}
          fromDate={fromDate}
          toDate={toDate}
          onChangePeriod={onChangePeriod}
          stores={stores}
          storeId={storeId}
          onChangeStore={onChangeStore}
          horizonDays={horizonDays}
          onChangeHorizon={onChangeHorizon}
          userName={userName ?? undefined}
          searchQuery={searchQuery}
          onChangeSearch={onChangeSearch}
        />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8">
          <div key={active} className="oy-anim-page">
            {active === 'inventory' && (
              <InventoryView
                inputs={inventory}
                horizonDays={horizonDays}
                currency={currency}
                turnoverTrend={turnoverTrend}
              />
            )}
            {active === 'abc' && <AbcView inputs={abc} currency={currency} />}
            {active === 'xyz' && <XyzView inputs={xyz} />}
            {active === 'rfm' && <RfmView transactions={rfm} currency={currency} />}
            {active === 'debts' && (
              <DebtsView
                initialDebtors={debtors}
                groups={debtorGroups}
                currency={currency}
                onScan={onScanDebtors}
                scanning={debtorsScanning}
                scanProgress={debtorsProgress}
                scanError={debtorsError}
                onCreateTask={onCreateDebtorTask}
                assigneeName={assigneeName}
              />
            )}
            {active === 'ai' && (
              <AiView context={aiContext} isLive={source === 'moysklad'} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
