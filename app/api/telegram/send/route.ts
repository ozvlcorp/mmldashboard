/**
 * Telegram webhook handler.
 *
 * GET /api/telegram/send?phone=...&text=...
 *
 * Эта ссылка попадает в описание задачи МойСклад. Когда менеджер кликает,
 * браузер открывает её, мы парсим параметры и (в будущем) отправляем сообщение
 * через Telegram Bot API. Пока — stub: логируем и возвращаем подтверждение.
 *
 * Для подключения боевого бота:
 *   1. Получить токен от @BotFather.
 *   2. Сохранить в env: TELEGRAM_BOT_TOKEN.
 *   3. Завести таблицу phone → chat_id (т.к. Telegram не позволяет писать по номеру).
 *   4. Раскомментировать sendTelegramMessage() ниже.
 */

import { NextResponse } from 'next/server';

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
