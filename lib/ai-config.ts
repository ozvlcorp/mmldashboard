/**
 * Конфиг ИИ-консультанта на стороне клиента (гибрид).
 *
 * Если сервер задал ANTHROPIC_API_KEY — этот ключ не нужен, всё работает
 * без настройки. Если сервер без ключа (например, на preview), клиент может
 * ввести свой ключ Anthropic — он хранится только в localStorage браузера и
 * уходит на наш бэкенд лишь при запросе к ИИ (как прокси к api.anthropic.com).
 */

const KEY = 'oy-ai-config';

export type AiConfig = {
  apiKey: string;
  model?: string;
};

export function loadAiConfig(): AiConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AiConfig;
    if (!parsed.apiKey) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAiConfig(cfg: AiConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* quota / privacy */
  }
}

export function clearAiConfig(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export type AiMessage = { role: 'user' | 'assistant'; content: string };

export async function askAi(
  messages: AiMessage[],
  context: unknown,
): Promise<{ ok: true; text: string } | { ok: false; error: string; needKey?: boolean }> {
  const cfg = loadAiConfig();
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        context,
        apiKey: cfg?.apiKey,
        model: cfg?.model,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        error: data?.detail || data?.error || `HTTP ${res.status}`,
        needKey: data?.error === 'no_key',
      };
    }
    return { ok: true, text: data.text ?? '' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
