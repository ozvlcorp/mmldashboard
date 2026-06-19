/**
 * Создаёт задачу в МойСклад для одного или нескольких должников.
 *
 * POST /api/moysklad/debts/tasks
 *   {
 *     token,
 *     debtors: DebtCandidate[],
 *     assigneeHref: string,        // meta.href сотрудника
 *     telegramWebhookBase?: string // если задан, в описание попадёт ссылка
 *   }
 *
 * Возвращает массив { demandId, taskId, ok } для каждого должника.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MoyskladClient } from '@/lib/moysklad/client';
import {
  buildTelegramLink,
  debtTaskDescription,
  type DebtCandidate,
} from '@/lib/moysklad/debts';

const DebtorSchema = z.object({
  demandId: z.string(),
  demandName: z.string(),
  demandMoment: z.string(),
  demandSum: z.number(),
  counterpartyId: z.string(),
  counterpartyName: z.string(),
  counterpartyPhone: z.string().optional(),
  balance: z.number(),
  debtAmount: z.number(),
});

const Body = z.object({
  token: z.string().min(10),
  debtors: z.array(DebtorSchema).min(1),
  assigneeHref: z.string().url(),
  telegramWebhookBase: z.string().url().optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: 'Bad request', detail: e instanceof Error ? e.message : String(e) },
      { status: 400 },
    );
  }
  const { token, debtors, assigneeHref, telegramWebhookBase } = parsed;
  const client = new MoyskladClient({ kind: 'token', token });

  const results: Array<{ demandId: string; taskId?: string; ok: boolean; error?: string }> =
    [];

  for (const d of debtors as DebtCandidate[]) {
    const telegramLink = telegramWebhookBase
      ? buildTelegramLink({
          webhookBase: telegramWebhookBase,
          phone: d.counterpartyPhone,
          text: `Здравствуйте! Напоминаем о задолженности ${Math.round(d.debtAmount).toLocaleString('ru-RU')} сум по отгрузке ${d.demandName}.`,
        })
      : undefined;

    try {
      const task = await client.createTask({
        description: debtTaskDescription(d, telegramLink),
        assignee: {
          meta: {
            href: assigneeHref,
            type: 'employee',
            mediaType: 'application/json',
          },
        },
        agent: {
          meta: {
            href: `https://api.moysklad.ru/api/remap/1.2/entity/counterparty/${d.counterpartyId}`,
            type: 'counterparty',
            mediaType: 'application/json',
          },
        },
      });
      results.push({ demandId: d.demandId, taskId: task.id, ok: true });
    } catch (e) {
      results.push({
        demandId: d.demandId,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    created: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
