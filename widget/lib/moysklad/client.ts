/**
 * Минимальный клиент МойСклад JSON API 1.2.
 * Документация: https://dev.moysklad.ru/doc/api/remap/1.2/
 *
 * Авторизация: либо Basic (логин:пароль), либо Bearer (токен от Vendor App).
 */

import type {
  MsAssortmentItem,
  MsAttributeMetadata,
  MsCounterparty,
  MsCounterpartyReport,
  MsDemand,
  MsEmployee,
  MsListResponse,
  MsProduct,
  MsTaskCreatePayload,
} from './types';

const VENDOR_HOST = 'https://api.moysklad.ru/api/remap/1.2';

const BASE = 'https://api.moysklad.ru/api/remap/1.2';

export type MsAuth =
  | { kind: 'token'; token: string }
  | { kind: 'basic'; login: string; password: string };

export class MoyskladClient {
  constructor(private auth: MsAuth) {}

  private headers(): HeadersInit {
    const h: Record<string, string> = {
      Accept: 'application/json;charset=utf-8',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip',
    };
    if (this.auth.kind === 'token') {
      h.Authorization = `Bearer ${this.auth.token}`;
    } else {
      const b = Buffer.from(`${this.auth.login}:${this.auth.password}`).toString(
        'base64',
      );
      h.Authorization = `Basic ${b}`;
    }
    return h;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = path.startsWith('http') ? path : `${BASE}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: { ...this.headers(), ...(init.headers ?? {}) },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`МойСклад API ${res.status}: ${text || res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  /** Постранично обходит коллекцию, выгребая всё */
  async listAll<T>(path: string, limit = 1000): Promise<T[]> {
    const sep = path.includes('?') ? '&' : '?';
    let url: string | null = `${path}${sep}limit=${limit}&offset=0`;
    const out: T[] = [];
    while (url) {
      const page: MsListResponse<T> = await this.request<MsListResponse<T>>(url);
      out.push(...page.rows);
      url = page.meta?.nextHref ?? null;
    }
    return out;
  }

  products(): Promise<MsProduct[]> {
    return this.listAll<MsProduct>('/entity/product');
  }

  /**
   * Ассортимент с остатками. Возвращает все позиции (товары + варианты + услуги),
   * для которых есть запас или установлены цены.
   */
  assortment(): Promise<MsAssortmentItem[]> {
    return this.listAll<MsAssortmentItem>('/entity/assortment?stockStore.byStore=true');
  }

  /** Отгрузки за период (входной формат: YYYY-MM-DD HH:mm:ss) */
  demands(from: string, to: string): Promise<MsDemand[]> {
    const params = new URLSearchParams({
      filter: `moment>=${from};moment<=${to}`,
      expand: 'positions.assortment,agent',
      order: 'moment,asc',
    });
    return this.listAll<MsDemand>(`/entity/demand?${params.toString()}`);
  }

  /**
   * Метаданные товаров — включая список всех дополнительных полей (атрибутов).
   * Используется, чтобы найти ID атрибута «Норматив, дни» по имени.
   */
  async productAttributes(): Promise<MsAttributeMetadata[]> {
    const data = await this.request<{ attributes?: MsAttributeMetadata[] }>(
      '/entity/product/metadata',
    );
    return data.attributes ?? [];
  }

  /**
   * Поиск отгрузок по значению кастомного атрибута (например, «Дата напоминания»).
   * `attributeId` — UUID атрибута сущности demand.
   * `value` — значение для фильтра (для даты используется формат YYYY-MM-DD).
   */
  demandsByAttribute(
    attributeId: string,
    value: string,
    opts: { expand?: string } = {},
  ): Promise<MsDemand[]> {
    const attrHref = `${VENDOR_HOST}/entity/demand/metadata/attributes/${attributeId}`;
    const params = new URLSearchParams({
      filter: `${attrHref}=${value}`,
      expand: opts.expand ?? 'agent,positions.assortment',
      order: 'moment,desc',
    });
    return this.listAll<MsDemand>(`/entity/demand?${params.toString()}`);
  }

  /** Баланс контрагента (через отчёт). Возвращает запись или null, если не найдено. */
  async counterpartyReport(counterpartyId: string): Promise<MsCounterpartyReport | null> {
    const href = `${VENDOR_HOST}/entity/counterparty/${counterpartyId}`;
    const params = new URLSearchParams({ filter: `counterparty=${href}` });
    const data = await this.request<MsListResponse<MsCounterpartyReport>>(
      `/report/counterparty?${params.toString()}`,
    );
    return data.rows[0] ?? null;
  }

  /** Карточка контрагента */
  counterparty(id: string): Promise<MsCounterparty> {
    return this.request<MsCounterparty>(`/entity/counterparty/${id}`);
  }

  /** Список сотрудников — нужен для выбора ответственного при создании задачи */
  employees(): Promise<MsEmployee[]> {
    return this.listAll<MsEmployee>('/entity/employee');
  }

  /** Создаёт задачу для менеджера */
  createTask(payload: MsTaskCreatePayload): Promise<{ id: string; meta: { href: string } }> {
    return this.request('/entity/task', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** Отчёт по остаткам — компактнее ассортимента, если нужны только числа */
  stockReport(): Promise<
    Array<{
      meta: { type: string };
      stock: number;
      reserve: number;
      inTransit: number;
      quantity: number;
      price: number;
      salePrice: number;
      name: string;
      code?: string;
      article?: string;
      assortment?: { meta: { href: string } };
    }>
  > {
    return this.listAll('/report/stock/all/current?stockType=stock');
  }
}

export function msMoment(d: Date): string {
  // МойСклад принимает формат "YYYY-MM-DD HH:mm:ss"
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
