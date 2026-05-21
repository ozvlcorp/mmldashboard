/**
 * Telegram-конфиг для уведомлений менеджера. Хранится в localStorage:
 * каждый пользователь виджета подключает свой бот и пишет в свой чат.
 *
 * Бот-токен — секрет, поэтому хранится только локально в браузере
 * пользователя и отправляется на наш бэкенд лишь при фактической отправке
 * сообщения (proxy через /api/telegram/send).
 */

const KEY = 'oy-telegram-config';

export type TelegramConfig = {
  botToken: string;
  chatId: string;
};

export function loadTelegramConfig(): TelegramConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TelegramConfig;
    if (!parsed.botToken || !parsed.chatId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveTelegramConfig(cfg: TelegramConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* quota / privacy */
  }
}

export function clearTelegramConfig(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export async function sendTelegram(
  text: string,
  cfg?: TelegramConfig | null,
): Promise<{ ok: boolean; error?: string }> {
  const config = cfg ?? loadTelegramConfig();
  if (!config) return { ok: false, error: 'Telegram не подключён' };
  try {
    const res = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, text }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
