/**
 * Возвращает список дополнительных полей (атрибутов) товара из МойСклад.
 * Нужен, чтобы пользователь мог выбрать, какое поле использовать как «Норматив запаса».
 *
 * Использование:
 *   GET /api/moysklad/attributes?token=<BEARER_TOKEN>
 *
 * Безопаснее передавать токен через заголовок Authorization вместо query:
 *   Authorization: Bearer <BEARER_TOKEN>
 */

import { NextResponse } from 'next/server';
import { MoyskladClient } from '@/lib/moysklad/client';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const headerToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const token = headerToken ?? url.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 401 });
  }
  const client = new MoyskladClient({ kind: 'token', token });
  try {
    const attributes = await client.productAttributes();
    return NextResponse.json({
      attributes: attributes.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        required: a.required ?? false,
        suitableForNorm: a.type === 'long' || a.type === 'double',
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'МойСклад API failure', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
