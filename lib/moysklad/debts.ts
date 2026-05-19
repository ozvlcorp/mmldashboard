/**
 * Сценарий ежедневной проверки долгов:
 *   1. Найти отгрузки с кастомным атрибутом «Дата напоминания» = сегодня.
 *   2. Для каждой проверить баланс контрагента — если отрицательный, это должник.
 *   3. Создать задачу в МойСклад с описанием долга и ссылкой на Telegram-вебхук.
 */

import type { MoyskladClient } from './client';
import type { MsCounterparty, MsDemand } from './types';

export type DebtCandidate = {
  demandId: string;
  demandName: string;
  demandMoment: string;
  demandSum: number;            // в сумах (рублях) — клиент уже делит на 100
  counterpartyId: string;
  counterpartyName: string;
  counterpartyPhone?: string;
  balance: number;              // отрицательный = долг
  debtAmount: number;           // положительное число = модуль долга
};

export type TelegramLinkParams = {
  webhookBase: string;          // например, https://your-app.vercel.app/api/telegram/send
  phone?: string;
  text: string;
};

export function buildTelegramLink(params: TelegramLinkParams): string {
  const url = new URL(params.webhookBase);
  if (params.phone) url.searchParams.set('phone', params.phone);
  url.searchParams.set('text', params.text);
  return url.toString();
}

export function debtTaskDescription(d: DebtCandidate, telegramLink?: string): string {
  const lines = [
    `Клиент: ${d.counterpartyName}`,
    `Долг: ${formatMoney(d.debtAmount)}`,
    `Отгрузка №: ${d.demandName}`,
    `Дата отгрузки: ${formatDate(d.demandMoment)}`,
  ];
  if (d.counterpartyPhone) lines.push(`Телефон: ${d.counterpartyPhone}`);
  if (telegramLink) {
    lines.push('');
    lines.push(`Ссылка для отправки напоминания: ${telegramLink}`);
  }
  return lines.join('\n');
}

function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU');
}

/**
 * Полный пайплайн поиска должников. Возвращает только тех, у кого реально есть долг.
 *
 * @param client      авторизованный клиент МойСклад
 * @param attributeId UUID кастомного атрибута на отгрузке (например, «Дата напоминания»)
 * @param dateISO     дата для фильтра в формате YYYY-MM-DD
 */
export async function findDebtors(
  client: MoyskladClient,
  attributeId: string,
  dateISO: string,
): Promise<DebtCandidate[]> {
  const demands = await client.demandsByAttribute(attributeId, dateISO, {
    expand: 'agent',
  });
  const results: DebtCandidate[] = [];

  // Параллельные проверки балансов, но с ограничением одновременности
  const queue = [...demands];
  const workers = Array.from({ length: Math.min(5, queue.length) }, async () => {
    while (queue.length) {
      const d = queue.shift();
      if (!d) break;
      const candidate = await checkDemand(client, d);
      if (candidate) results.push(candidate);
    }
  });
  await Promise.all(workers);
  return results.sort((a, b) => b.debtAmount - a.debtAmount);
}

async function checkDemand(
  client: MoyskladClient,
  d: MsDemand,
): Promise<DebtCandidate | null> {
  const agentHref = d.agent?.meta?.href;
  if (!agentHref) return null;
  const counterpartyId = extractUuid(agentHref);
  if (!counterpartyId) return null;

  const report = await client.counterpartyReport(counterpartyId);
  if (!report || report.balance >= 0) return null;

  // Карточка контрагента — для имени и телефона
  let counterparty: MsCounterparty | null = null;
  try {
    counterparty = await client.counterparty(counterpartyId);
  } catch {
    // не критично — обойдёмся данными из agent
  }

  return {
    demandId: d.id,
    demandName: d.name,
    demandMoment: d.moment,
    demandSum: d.sum / 100,
    counterpartyId,
    counterpartyName: counterparty?.name ?? d.agent?.name ?? counterpartyId,
    counterpartyPhone: counterparty?.phone,
    balance: report.balance / 100,
    debtAmount: Math.abs(report.balance) / 100,
  };
}

function extractUuid(href: string): string | null {
  const m = href.match(/\/([0-9a-f-]{36})(?:\/|$|\?)/i);
  return m ? m[1] : null;
}

export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
