export type MsMeta = {
  href: string;
  type: string;
  mediaType: string;
};

export type MsAttributeType =
  | 'string'
  | 'long'
  | 'double'
  | 'boolean'
  | 'time'
  | 'text'
  | 'link'
  | 'file'
  | 'customentity';

export type MsAttribute = {
  id: string;
  name: string;
  type: MsAttributeType;
  value: string | number | boolean | null;
  meta: MsMeta;
};

export type MsAttributeMetadata = {
  id: string;
  name: string;
  type: MsAttributeType;
  required?: boolean;
  description?: string;
  meta: MsMeta;
};

export type MsProduct = {
  id: string;
  name: string;
  code?: string;
  article?: string;
  buyPrice?: { value: number; currency: MsMeta };
  salePrices?: Array<{ value: number; priceType: { name: string; meta: MsMeta } }>;
  uom?: { meta: MsMeta };
  attributes?: MsAttribute[];
  meta: MsMeta;
};

export type MsAssortmentItem = MsProduct & {
  stock: number;
  reserve: number;
  inTransit: number;
  quantity: number;
};

export type MsDemandPosition = {
  id: string;
  quantity: number;
  price: number;
  assortment: { meta: MsMeta; name?: string };
  meta: MsMeta;
};

export type MsDemand = {
  id: string;
  name: string;
  moment: string;       // ISO дата
  sum: number;          // в копейках
  agent?: { meta: MsMeta; name?: string };
  positions?: { meta: MsMeta; rows?: MsDemandPosition[] };
  meta: MsMeta;
};

export type MsListResponse<T> = {
  context: unknown;
  meta: { size: number; limit: number; offset: number; nextHref?: string };
  rows: T[];
};

export type MsCounterparty = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  legalTitle?: string;
  meta: MsMeta;
};

export type MsCounterpartyReport = {
  counterparty: { meta: MsMeta };
  balance: number;        // в копейках, отрицательный = долг клиента
  firstDemandDate?: string;
  lastDemandDate?: string;
  demandsCount?: number;
  demandsSum?: number;
  meta: MsMeta;
};

export type MsTaskCreatePayload = {
  description: string;
  assignee?: { meta: MsMeta };
  dueToDate?: string;
  agent?: { meta: MsMeta };
  operation?: { meta: MsMeta };
};

export type MsEmployee = {
  id: string;
  name: string;
  email?: string;
  meta: MsMeta;
};

/** JWT claim, переданный МойСклад в виджет */
export type MoyskladWidgetClaims = {
  iss: string;        // accountId
  sub: string;        // userId
  aud?: string;       // appUid
  iat: number;
  exp: number;
  appUid?: string;
  accountId?: string;
  userId?: string;
};
