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

export type AskResult = { ok: true } | { ok: false; error: string; needKey?: boolean };

/**
 * Спрашивает ИИ и стримит ответ по кусочкам через onChunk.
 * Ошибки до начала потока (нет ключа, неверный ключ) приходят JSON-ом и
 * возвращаются как { ok:false }. Иначе текст идёт чанками и в конце { ok:true }.
 */
export async function askAiStream(
  messages: AiMessage[],
  context: unknown,
  onChunk: (text: string) => void,
): Promise<AskResult> {
  const cfg = loadAiConfig();
  let res: Response;
  try {
    res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        context,
        apiKey: cfg?.apiKey,
        model: cfg?.model,
      }),
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    return {
      ok: false,
      error: data?.detail || data?.error || `HTTP ${res.status}`,
      needKey: data?.error === 'no_key',
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      if (text) onChunk(text);
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  return { ok: true };
}
