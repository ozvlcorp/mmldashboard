/**
 * Лёгкий прокси для одной страницы МойСклад API.
 *
 * Зачем: серверные функции на Netlify Free ограничены 10 секундами. Полная
 * выгрузка ассортимента + продаж за 30 дней не укладывается. Поэтому клиент
 * (браузер) орекстрирует пагинацию: дёргает этот эндпоинт по одной странице,
 * собирает все rows у себя, после чего прогоняет чистые трансформы локально.
 *
 * POST body: { token: string, path: string }
 *   path — относительный URL вроде "/entity/assortment?limit=500"
 *   ИЛИ полный nextHref (https://api.moysklad.ru/api/remap/1.2/...) из meta.
 *
 * Возвращает сырой JSON одной страницы МойСклад как есть.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({
  token: z.string().min(10),
  path: z.string().min(1),
});

const BASE = 'https://api.moysklad.ru/api/remap/1.2';
const ALLOWED_HOST = 'https://api.moysklad.ru/';

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
  const { token, path } = parsed;
  const url = path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? path : `/${path}`}`;

  if (!url.startsWith(ALLOWED_HOST)) {
    return NextResponse.json(
      { error: 'Bad request', detail: 'path must target api.moysklad.ru' },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json;charset=utf-8',
        'Accept-Encoding': 'gzip',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: 'МойСклад API failure', status: res.status, detail: text.slice(0, 500) },
        { status: 502 },
      );
    }
    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Network failure', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}

export const runtime = 'nodejs';
