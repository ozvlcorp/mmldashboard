'use client';

import * as React from 'react';
import { Link2, LogOut, RefreshCw } from 'lucide-react';
import { Dashboard } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { ConnectDialog } from '@/components/connect-dialog';
import { useT } from '@/lib/i18n/provider';
import {
  createDebtorTask,
  loadAnalytics,
  loadCurrentEmployee,
  loadDebtors,
  type AnalyticsResult,
  type ConnectParams,
  type DebtorsProgress,
  type LoadProgress,
} from '@/lib/moysklad/browser';
import type { DebtCandidate } from '@/lib/moysklad/debts';
import {
  DEMO_INVENTORY,
  DEMO_ABC,
  DEMO_XYZ,
  DEMO_RFM,
  DEMO_DEBTORS,
} from '@/lib/demo-data';

const TOKEN_KEY = 'oy-ms-token';
const PARAMS_KEY = 'oy-ms-params';

export function HomeClient() {
  const { t } = useT();

  const formatProgress = (p: LoadProgress | null): string | null => {
    if (!p) return null;
    if (p.stage === 'assortment') return t('connect.progress.assortment', { count: p.count });
    if (p.stage === 'demands') return t('connect.progress.demands', { count: p.count });
    return t('connect.progress.compute');
  };

  const formatDebtorsProgress = (p: DebtorsProgress | null): string | null => {
    if (!p) return null;
    if (p.stage === 'reports') return t('debts.progress.reports', { count: p.count });
    return t('debts.progress.cards', { done: p.done, total: p.total });
  };
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState<LoadProgress | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [debtors, setDebtors] = React.useState<DebtCandidate[] | null>(null);
  const [debtorsScanning, setDebtorsScanning] = React.useState(false);
  const [debtorsProgress, setDebtorsProgress] = React.useState<DebtorsProgress | null>(null);
  const [debtorsError, setDebtorsError] = React.useState<string | null>(null);
  const [assignee, setAssignee] = React.useState<{ href: string; name: string } | null>(null);

  const createTask = React.useCallback(
    async (d: DebtCandidate): Promise<{ taskId: string }> => {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error('Нет токена МойСклад');
      if (!assignee?.href) throw new Error('Не удалось определить ответственного');
      const webhookBase =
        typeof window !== 'undefined' ? `${window.location.origin}/api/telegram/send` : undefined;
      return createDebtorTask(token, d, assignee.href, webhookBase);
    },
    [assignee],
  );

  const scanDebtors = React.useCallback(async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    setDebtorsScanning(true);
    setDebtorsError(null);
    setDebtorsProgress(null);
    try {
      const list = await loadDebtors(token, (e) => setDebtorsProgress(e));
      setDebtors(list);
    } catch (e) {
      setDebtorsError(e instanceof Error ? e.message : String(e));
    } finally {
      setDebtorsScanning(false);
      setDebtorsProgress(null);
    }
  }, []);

  const load = React.useCallback(
    async (token: string, params: ConnectParams, opts: { clearOnError?: boolean } = {}) => {
      setLoading(true);
      setError(null);
      setProgress(null);
      try {
        const result = await loadAnalytics(token, params, (e) => setProgress(e));
        setData(result);
        try {
          sessionStorage.setItem(TOKEN_KEY, token);
          sessionStorage.setItem(PARAMS_KEY, JSON.stringify(params));
        } catch {
          /* ignore */
        }
        setOpen(false);
        // background-load ответственного для создания задач, ошибку молча игнорим
        loadCurrentEmployee(token).then(setAssignee).catch(() => setAssignee(null));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        if (opts.clearOnError) {
          try {
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(PARAMS_KEY);
          } catch {
            /* ignore */
          }
        }
      } finally {
        setLoading(false);
        setProgress(null);
      }
    },
    [],
  );

  React.useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const paramsRaw = sessionStorage.getItem(PARAMS_KEY);
    if (!token) return;
    let params: ConnectParams = { periodDays: 30, normDays: 10 };
    try {
      if (paramsRaw) params = { ...params, ...JSON.parse(paramsRaw) };
    } catch {
      /* ignore */
    }
    void load(token, params, { clearOnError: true });
  }, [load]);

  function disconnect() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(PARAMS_KEY);
    } catch {
      /* ignore */
    }
    setData(null);
    setError(null);
    setDebtors(null);
    setDebtorsError(null);
    setAssignee(null);
  }

  function manualRefresh() {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    const paramsRaw = sessionStorage.getItem(PARAMS_KEY);
    let params: ConnectParams = { periodDays: 30, normDays: 10 };
    try {
      if (paramsRaw) params = { ...params, ...JSON.parse(paramsRaw) };
    } catch {
      /* ignore */
    }
    void load(token, params);
  }

  const isLive = !!data;
  const inventory = data?.inventory ?? DEMO_INVENTORY;
  const abc = data?.abc ?? DEMO_ABC;
  const xyz = data?.xyz ?? DEMO_XYZ;
  const rfm = data?.rfm ?? DEMO_RFM;
  const dashDebtors = isLive ? debtors ?? [] : DEMO_DEBTORS;
  const progressLabel = formatProgress(progress);
  const debtorsProgressLabel = formatDebtorsProgress(debtorsProgress);

  return (
    <div>
      <div
        className={
          (isLive
            ? 'bg-(--color-success-soft)/40'
            : 'bg-(--color-warning-soft)/40') +
          ' flex flex-wrap items-center justify-between gap-3 border-b border-(--color-border) px-4 py-2.5 lg:px-8'
        }
      >
        <div className="min-w-0 text-[12px] text-(--color-fg)">
          {isLive ? (
            <>
              <span className="font-semibold">{t('app.connected')}</span>
              {data && (
                <span className="ml-2 text-(--color-muted-fg)">
                  {t('connect.meta', {
                    products: data.meta.productsCount,
                    demands: data.meta.demandsCount,
                    days: data.meta.periodDays,
                  })}
                </span>
              )}
            </>
          ) : loading && progressLabel ? (
            <span className="text-(--color-muted-fg)">{progressLabel}</span>
          ) : (
            t('app.demoBanner')
          )}
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span
              className="max-w-[420px] truncate rounded-md bg-rose-100 px-2 py-1 text-[11px] font-medium text-rose-700"
              title={error}
            >
              {error}
            </span>
          )}
          {isLive ? (
            <>
              <Button size="sm" variant="ghost" onClick={manualRefresh} disabled={loading}>
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                {t('app.refresh')}
              </Button>
              <Button size="sm" variant="outline" onClick={disconnect} disabled={loading}>
                <LogOut size={13} />
                {t('connect.disconnect')}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setOpen(true)} disabled={loading}>
              <Link2 size={13} />
              {loading ? t('connect.loading') : t('connect.openButton')}
            </Button>
          )}
        </div>
      </div>

      <Dashboard
        inventory={inventory}
        abc={abc}
        xyz={xyz}
        rfm={rfm}
        debtors={dashDebtors}
        source={isLive ? 'moysklad' : 'demo'}
        currency="сум"
        horizonDays={10}
        onScanDebtors={isLive ? scanDebtors : undefined}
        debtorsScanning={debtorsScanning}
        debtorsProgress={debtorsProgressLabel}
        debtorsError={debtorsError}
        onCreateDebtorTask={isLive && assignee ? createTask : undefined}
        assigneeName={assignee?.name ?? null}
      />

      <ConnectDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(token, params) => void load(token, params)}
        loading={loading}
        progressLabel={progressLabel}
        error={error}
      />
    </div>
  );
}
