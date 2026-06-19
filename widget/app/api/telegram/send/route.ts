/**
 * Telegram-интеграция.
 *
 * POST /api/telegram/send — основной путь.
 *   Body: { botToken, chatId, text }
 *   → Реально шлёт через Telegram Bot API. Возвращает JSON статус.
 *   Используется кнопкой «Telegram» в Долгах и тестовым сообщением в Settings.
 *
 * GET /api/telegram/send?phone=...&text=... — старый путь.
 *   Открывается из задачи МойСклад. Без сохранённой конфигурации показывает
 *   страницу-заглушку с инструкцией; в будущем можно подвязать к userspace.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

const SendBody = z.object({
  botToken: z.string().min(10),
  chatId: z.string().min(1),
  text: z.string().min(1).max(4096),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = SendBody.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Bad request' },
      { status: 400 },
    );
  }
  const { botToken, chatId, text } = parsed;
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = (await res.json().catch(() => null)) as
      | { ok: boolean; description?: string; result?: { message_id: number } }
      | null;
    if (!res.ok || !data?.ok) {
      return NextResponse.json(
        { ok: false, error: data?.description ?? `Telegram API ${res.status}` },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, messageId: data.result?.message_id });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const phone = url.searchParams.get('phone') ?? '';
  const text = url.searchParams.get('text') ?? '';

  // STUB: реальная отправка отключена. Подключение — см. инструкцию выше.
  console.log('[telegram-stub]', { phone, text });
  const sent = await sendTelegramMessage(phone, text).catch((e) => {
    console.error('[telegram-error]', e);
    return false;
  });

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${sent ? 'Сообщение отправлено' : 'Telegram не настроен'}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 24px; text-align: center; }
    h1 { color: ${sent ? '#10b981' : '#f59e0b'}; }
    .info { background: #f3f4f6; border-radius: 8px; padding: 12px; margin-top: 16px; text-align: left; font-size: 13px; word-break: break-all; }
    .label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <h1>${sent ? '✓ Сообщение отправлено' : '⚠ Telegram-бот не подключён'}</h1>
  <p>${sent ? 'Клиенту ушло напоминание в Telegram.' : 'Это заглушка. Когда подключите Telegram-бот, ссылка будет реально отправлять сообщения.'}</p>
  <div class="info">
    <div class="label">Телефон</div>
    <div>${escape(phone)}</div>
    <div class="label" style="margin-top:8px">Текст</div>
    <div>${escape(text)}</div>
  </div>
  <p style="margin-top:24px; color:#6b7280; font-size:13px">Вкладку можно закрыть.</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Реальная отправка через Telegram Bot API.
 * Возвращает true при успехе. По умолчанию выключена (нет токена).
 */
async function sendTelegramMessage(phone: string, text: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;

  // Telegram API требует chat_id, а не телефон. Здесь должна быть подстановка:
  // const chatId = await lookupChatIdByPhone(phone);
  // if (!chatId) return false;
  //
  // const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ chat_id: chatId, text }),
  // });
  // return res.ok;

  void phone;
  void text;
  return false;
}
