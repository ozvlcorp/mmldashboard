/**
 * ИИ-консультант для предпринимателя (стриминговый).
 *
 * POST /api/ai/chat
 *   Body: {
 *     messages: { role: 'user' | 'assistant', content: string }[],
 *     context?: object,   // выжимка из аналитики магазина (ShopContext)
 *     apiKey?: string,    // ключ пользователя (если сервер без env)
 *     model?: string
 *   }
 *
 * Ключ берётся в порядке: ANTHROPIC_API_KEY (env) → apiKey из тела.
 * Так гибрид работает и на проде (env), и для теста (ключ клиента).
 *
 * Ответ стримится как plain-text чанки (text/plain). Стриминг важен: на
 * Netlify Functions есть короткий лимит, а одиночный не-стрим запрос к Opus
 * с осмысленным ответом может в него не уложиться (та же проблема, что была
 * у /analytics). Поток держит соединение живым и отдаёт текст по мере генерации.
 *
 * Контекст данных кладётся в system-блок с cache_control, чтобы при
 * нескольких вопросах подряд не платить повторно за одни и те же данные.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      }),
    )
    .min(1)
    .max(40),
  context: z.unknown().optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

const SYSTEM_INSTRUCTIONS = `Ты — опытный бизнес-аналитик и консультант по рознице и оптовой торговле для малого бизнеса в Узбекистане и СНГ. Тебя встроили в виджет аналитики «OY Analytics» для сервиса МойСклад.

Твоя задача — помогать владельцу магазина зарабатывать больше и решать проблемы, опираясь на РЕАЛЬНЫЕ данные его магазина, которые приведены ниже в блоке DATA.

Правила:
- Отвечай на языке вопроса (русский, узбекский или английском).
- Будь конкретным: называй товары, клиентов, суммы и проценты из данных. Не выдумывай цифры, которых нет в DATA.
- Каждый ответ заканчивай блоком «Что сделать:» с 2–4 конкретными действиями по приоритету.
- Денежные суммы указывай в валюте магазина (поле currency).
- Если данных не хватает для точного ответа — честно скажи об этом и предложи, что посмотреть или какой период загрузить.
- Пиши кратко и по делу, как живой консультант, без воды и канцелярита. Используй маркированные списки где уместно.
- Помни о смысле метрик: OOS (потери из-за дефицита) — упущенная прибыль, надо закупать; «заморожено» — лишний запас, надо распродавать; MML — топ-товары ~80% выручки, их нельзя пускать в дефицит; ABC — вклад в выручку; XYZ — стабильность спроса; RFM — ценность клиентов.`;

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

  const { messages, context, apiKey, model } = parsed;
  const key = process.env.ANTHROPIC_API_KEY || apiKey;
  if (!key) {
    return NextResponse.json(
      {
        error: 'no_key',
        detail:
          'ИИ не настроен. Задайте ANTHROPIC_API_KEY на сервере или введите ключ в настройках.',
      },
      { status: 400 },
    );
  }

  const resolvedModel = process.env.ANTHROPIC_MODEL || model || 'claude-opus-4-8';

  const system = [
    { type: 'text' as const, text: SYSTEM_INSTRUCTIONS },
    {
      type: 'text' as const,
      text: context
        ? `DATA (данные магазина, JSON):\n${JSON.stringify(context)}`
        : 'DATA: магазин не подключён, данных нет — отвечай общими рекомендациями и предложи подключить МойСклад.',
      cache_control: { type: 'ephemeral' as const },
    },
  ];

  let upstream: Response;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 8000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'ai_failure', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }

  // Ошибки до начала потока (неверный ключ, rate limit) приходят как JSON с не-200
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    let detail = `Anthropic API ${upstream.status}`;
    try {
      const j = JSON.parse(text);
      detail = j?.error?.message ?? detail;
    } catch {
      /* keep default */
    }
    return NextResponse.json({ error: 'ai_failure', detail }, { status: 502 });
  }

  // Парсим SSE от Anthropic и переотдаём только текст ответа простыми чанками
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const evt = JSON.parse(payload);
          if (
            evt.type === 'content_block_delta' &&
            evt.delta?.type === 'text_delta' &&
            typeof evt.delta.text === 'string'
          ) {
            controller.enqueue(encoder.encode(evt.delta.text));
          }
        } catch {
          /* ignore non-JSON keepalive lines */
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
