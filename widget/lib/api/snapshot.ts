/**
 * Snapshot API — клиент к нашему backend (Phase 2).
 *
 * Если NEXT_PUBLIC_BACKEND_URL задан — виджет может попросить готовый
 * AnalyticsResult у backend (~200мс) вместо того чтобы заново тащить
 * всё из МойСклад (10-30с). Если backend не отвечает / нет снапшота —
 * вызывающий код должен сделать fallback на loadAnalytics напрямую.
 *
 * Имя виджета зафиксировано как 'mml' — это путь-namespace на backend
 * (см. `app/routers/*.py`, эндпоинты вида `/{widget_name}/snapshot`).
 */
import type { AnalyticsResult } from '@/lib/moysklad/browser';

const WIDGET_NAME = 'mml';

/** Базовый URL backend. Пусто = backend не сконфигурирован → snapshot выключен. */
function getBackendUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  return url || null;
}

export function isBackendEnabled(): boolean {
  return getBackendUrl() !== null;
}

export type SnapshotResponse = {
  snapshot_at: string;
  period_from: string;
  period_to: string;
  store_id: string | null;
} & AnalyticsResult;

export type SnapshotStatus = {
  has_snapshot: boolean;
  last_snapshot_at: string | null;
  last_sync_at: string | null;
  last_sync_status: 'ok' | 'error' | 'running' | null;
  last_error: string | null;
  next_sync_after: string | null;
  sync_count: number;
};

/** GET /{widget}/snapshot — возвращает null если snapshot ещё нет (404). */
export async function fetchSnapshot(
  accountId: string,
  storeId?: string,
): Promise<AnalyticsResult | null> {
  const backend = getBackendUrl();
  if (!backend) return null;
  const qs = new URLSearchParams({ account: accountId });
  if (storeId) qs.set('store', storeId);
  const url = `${backend}/${WIDGET_NAME}/snapshot?${qs.toString()}`;
  const res = await fetch(url, { method: 'GET' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`backend ${res.status}: ${await res.text().catch(() => '')}`);
  const body = (await res.json()) as SnapshotResponse;
  // Возвращаем то же что вернул бы loadAnalytics — структура совпадает.
  return {
    inventory: body.inventory,
    abc: body.abc,
    xyz: body.xyz,
    rfm: body.rfm,
    meta: body.meta,
  };
}

export async function fetchSnapshotStatus(accountId: string): Promise<SnapshotStatus | null> {
  const backend = getBackendUrl();
  if (!backend) return null;
  const url = `${backend}/${WIDGET_NAME}/snapshot/status?account=${encodeURIComponent(accountId)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as SnapshotStatus;
}

/**
 * POST /{widget}/snapshot — self-warming cache: виджет после того как
 * loadAnalytics успешно отработал, шлёт результат на backend. Следующее
 * открытие этого аккаунта (любым пользователем) пойдёт из готового
 * snapshot вместо повторного похода в МойСклад.
 *
 * Защищено ADMIN_SECRET на backend; чтобы виджет мог писать — передаём
 * NEXT_PUBLIC_BACKEND_WRITE_SECRET (если задана). В Phase 3 переедем на
 * per-tenant JWT, выпускаемый при context callback.
 */
export async function pushSnapshot(
  accountId: string,
  result: AnalyticsResult,
  storeId?: string,
  computeTimeMs?: number,
): Promise<void> {
  const backend = getBackendUrl();
  if (!backend) return;
  const writeSecret = process.env.NEXT_PUBLIC_BACKEND_WRITE_SECRET?.trim();
  // Без секрета на проде POST вернёт 403 — это нормально, snapshot
  // запишется когда worker подключится в Phase 2b. Запись из виджета —
  // это временный bootstrap, в production должна делать только серверная
  // сторона.
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (writeSecret) headers['X-Admin-Secret'] = writeSecret;

  const body = {
    period_from: result.meta.from,
    period_to: result.meta.to,
    store_id: storeId ?? result.meta.storeId ?? null,
    inventory: result.inventory,
    abc: result.abc,
    xyz: result.xyz,
    rfm: result.rfm,
    meta: result.meta,
    products_count: result.meta.productsCount,
    demands_count: result.meta.demandsCount,
    compute_time_ms: computeTimeMs ?? null,
  };
  try {
    await fetch(
      `${backend}/${WIDGET_NAME}/snapshot?account=${encodeURIComponent(accountId)}`,
      { method: 'POST', headers, body: JSON.stringify(body) },
    );
    // Игнорируем ответ — это best-effort фоновая запись. Если упало —
    // виджет всё равно показывает свежесчитанные данные.
  } catch {
    /* network error → не блокирует основной flow */
  }
}
