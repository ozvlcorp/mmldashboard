/**
 * Ежедневный сканер долгов.
 *
 * POST /api/moysklad/debts/scan
 *   { token, demandDateAttributeId, date?: "YYYY-MM-DD" }
 *
 * Возвращает список найденных должников. Задачи не создаёт — этим
 * занимается отдельный эндпоинт /api/moysklad/debts/tasks (POST).
 *
 * Будет вызываться:
 *  - Vercel Cron (см. vercel.ts — расписание добавим при деплое)
 *  - Кнопкой «Запустить сканирование» из вкладки «Долги»
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MoyskladClient } from '@/lib/moysklad/client';
import { findDebtors, todayISO } from '@/lib/moysklad/debts';

const Body = z.object({
  token: z.string().min(10),
  demandDateAttributeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
  const { token, demandDateAttributeId, date } = parsed;
  const targetDate = date ?? todayISO();

  const client = new MoyskladClient({ kind: 'token', token });
  try {
    const debtors = await findDebtors(client, demandDateAttributeId, targetDate);
    return NextResponse.json({
      date: targetDate,
      count: debtors.length,
      totalDebt: debtors.reduce((s, d) => s + d.debtAmount, 0),
      debtors,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'МойСклад API failure', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
