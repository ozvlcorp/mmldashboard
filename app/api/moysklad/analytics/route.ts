/**
 * Загружает данные из МойСклад и возвращает входы для всех 4 анализов.
 *
 * POST body:
 *   { token: string, periodDays?: number, priceTypeName?: string, normDays?: number }
 *
 * token — Bearer-токен пользователя МойСклад (можно сгенерировать в личном кабинете).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { MoyskladClient, msMoment } from '@/lib/moysklad/client';
import {
  assortmentToInventory,
  demandsToAbc,
  demandsToRfm,
  demandsToXyz,
} from '@/lib/moysklad/transform';

const Body = z.object({
  token: z.string().min(10),
  periodDays: z.number().int().positive().max(365).default(30),
  priceTypeName: z.string().optional(),
  normDays: z.number().int().positive().max(365).default(10),
  /** Имя или UUID дополнительного поля товара, в котором хранится норматив запаса */
  normDaysAttribute: z.string().optional(),
  xyzBucketDays: z.number().int().positive().max(60).default(7),
  xyzPeriods: z.number().int().min(3).max(52).default(8),
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
  const {
    token,
    periodDays,
    priceTypeName,
    normDays,
    normDaysAttribute,
    xyzBucketDays,
    xyzPeriods,
  } = parsed;

  const client = new MoyskladClient({ kind: 'token', token });
  const until = new Date();
  const from = new Date(until.getTime() - periodDays * 86400000);

  try {
    const [assortment, demands] = await Promise.all([
      client.assortment(),
      client.demands(msMoment(from), msMoment(until)),
    ]);

    const inventory = assortmentToInventory(assortment, demands, {
      periodDays,
      defaultNormDays: normDays,
      priceTypeName,
      normDaysAttribute,
    });
    const abc = demandsToAbc(demands);
    const xyz = demandsToXyz(demands, {
      bucketDays: xyzBucketDays,
      periodsCount: xyzPeriods,
      until,
    });
    const rfm = demandsToRfm(demands);

    return NextResponse.json({
      meta: {
        periodDays,
        from: from.toISOString(),
        to: until.toISOString(),
        productsCount: assortment.length,
        demandsCount: demands.length,
      },
      inventory,
      abc,
      xyz,
      rfm,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'МойСклад API failure', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
