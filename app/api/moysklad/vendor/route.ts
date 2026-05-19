/**
 * Колбэки для Vendor App МойСклад:
 *   PUT  /api/moysklad/vendor — установка / обновление приложения на аккаунте
 *   DELETE                    — удаление приложения с аккаунта
 *   GET  ?accountId=          — проверка статуса
 *
 * Документация: https://dev.moysklad.ru/doc/api/vendor/1.0/
 */

import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  // Здесь нужно сохранить accountId / accessToken в БД, чтобы потом
  // делать API-вызовы от имени аккаунта. В MVP — отвечаем 200 ОК.
  console.log('[vendor:install]', body);
  return NextResponse.json({ status: 'Activated' });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  console.log('[vendor:uninstall]', url.searchParams.toString());
  return NextResponse.json({ status: 'Deactivated' });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  return NextResponse.json({
    status: 'Activated',
    accountId: url.searchParams.get('accountId') ?? null,
  });
}
