/**
 * ИИ-консультант для предпринимателя.
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
- Отвечай на языке вопроса (русский, узбекский или английский).
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

  const resolvedModel =
    process.env.ANTHROPIC_MODEL || model || 'claude-sonnet-4-5';

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

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 1500,
        system,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = (await res.json().catch(() => null)) as
      | {
          content?: Array<{ type: string; text?: string }>;
          error?: { message?: string };
        }
      | null;

    if (!res.ok) {
      const detail = data?.error?.message ?? `Anthropic API ${res.status}`;
      return NextResponse.json({ error: 'ai_failure', detail }, { status: 502 });
    }

    const text =
      data?.content
        ?.filter((b) => b.type === 'text')
        .map((b) => b.text ?? '')
        .join('\n')
        .trim() || '';

    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: 'ai_failure', detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;
