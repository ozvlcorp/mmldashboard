'use client';

import * as React from 'react';
import { Sparkles, Send, Loader2, KeyRound, RotateCcw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useT } from '@/lib/i18n/provider';
import { askAi, saveAiConfig, type AiMessage } from '@/lib/ai-config';

export function AiView({
  context,
  isLive,
}: {
  context: unknown;
  isLive: boolean;
}) {
  const { t } = useT();
  const [messages, setMessages] = React.useState<AiMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needKey, setNeedKey] = React.useState(false);
  const [keyInput, setKeyInput] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const suggestions = [
    t('ai.q1'),
    t('ai.q2'),
    t('ai.q3'),
    t('ai.q4'),
  ];

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    setInput('');
    setError(null);
    const next = [...messages, { role: 'user' as const, content: q }];
    setMessages(next);
    setLoading(true);
    const res = await askAi(next, context);
    if (res.ok) {
      setMessages([...next, { role: 'assistant', content: res.text }]);
    } else {
      if (res.needKey) setNeedKey(true);
      setError(res.error);
    }
    setLoading(false);
  }

  function saveKey() {
    if (keyInput.trim().length < 10) return;
    saveAiConfig({ apiKey: keyInput.trim() });
    setNeedKey(false);
    setError(null);
    setKeyInput('');
  }

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col gap-4">
      {!isLive && (
        <div className="rounded-xl border border-(--color-warning)/30 bg-(--color-warning-soft)/40 px-4 py-2.5 text-[12px] text-(--color-fg)">
          {t('ai.demoNote')}
        </div>
      )}

      <Card className="flex flex-col" style={{ height: 'calc(100vh - 230px)', minHeight: 420 }}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles size={17} className="text-(--color-primary)" />
                {t('ai.title')}
              </CardTitle>
              <CardDescription>{t('ai.subtitle')}</CardDescription>
            </div>
            {messages.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setMessages([])}>
                <RotateCcw size={13} />
                {t('ai.clear')}
              </Button>
            )}
          </div>
        </CardHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
          {empty ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-(--color-primary-soft)">
                <Sparkles size={26} className="text-(--color-primary)" />
              </div>
              <div className="text-[15px] font-semibold">{t('ai.emptyTitle')}</div>
              <div className="mt-1 max-w-[420px] text-[12.5px] text-(--color-muted-fg)">
                {t('ai.emptyText')}
              </div>
              <div className="mt-5 grid w-full max-w-[560px] grid-cols-1 gap-2 sm:grid-cols-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="flex items-start gap-2 rounded-xl border border-(--color-border) bg-(--color-card) px-3 py-2.5 text-left text-[12.5px] hover:border-(--color-primary)/40 hover:bg-(--color-muted)"
                  >
                    <Lightbulb size={14} className="mt-0.5 shrink-0 text-(--color-primary)" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
                >
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[80%] rounded-2xl rounded-br-md bg-(--color-primary) px-4 py-2.5 text-[13px] text-(--color-primary-fg)'
                        : 'max-w-[85%] rounded-2xl rounded-bl-md bg-(--color-muted) px-4 py-3 text-[13px] text-(--color-fg)'
                    }
                  >
                    {m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-(--color-muted) px-4 py-3 text-[13px] text-(--color-muted-fg)">
                    <Loader2 size={14} className="animate-spin" />
                    {t('ai.thinking')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {needKey && (
          <div className="border-t border-(--color-border-soft) bg-(--color-muted)/30 px-6 py-3">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold">
              <KeyRound size={13} className="text-(--color-primary)" />
              {t('ai.keyTitle')}
            </div>
            <div className="mb-2 text-[11px] text-(--color-muted-fg)">{t('ai.keyHint')}</div>
            <div className="flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-…"
                className="h-9 flex-1 rounded-lg border border-(--color-border) bg-(--color-bg) px-3 font-mono text-[12px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20"
              />
              <Button size="sm" onClick={saveKey} disabled={keyInput.trim().length < 10}>
                {t('ai.keySave')}
              </Button>
            </div>
          </div>
        )}

        {error && !needKey && (
          <div className="border-t border-rose-200/50 bg-rose-50/60 px-6 py-2 text-[12px] text-rose-700">
            {error}
          </div>
        )}

        <div className="border-t border-(--color-border-soft) p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder={t('ai.placeholder')}
              className="max-h-32 flex-1 resize-none rounded-xl border border-(--color-border) bg-(--color-bg) px-3 py-2.5 text-[13px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

/** Минимальный безопасный рендер markdown: заголовки, списки, **жирный**. */
function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1.5" />;
        if (/^#{1,3}\s/.test(trimmed)) {
          return (
            <div key={i} className="mt-1 text-[13.5px] font-bold">
              {inline(trimmed.replace(/^#{1,3}\s/, ''))}
            </div>
          );
        }
        if (/^[-*•]\s/.test(trimmed)) {
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="text-(--color-primary)">•</span>
              <span>{inline(trimmed.replace(/^[-*•]\s/, ''))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const m = /^(\d+)\.\s(.*)$/.exec(trimmed);
          return (
            <div key={i} className="flex gap-1.5 pl-1">
              <span className="font-semibold text-(--color-primary)">{m?.[1]}.</span>
              <span>{inline(m?.[2] ?? trimmed)}</span>
            </div>
          );
        }
        return <div key={i}>{inline(trimmed)}</div>;
      })}
    </div>
  );
}

function inline(s: string): React.ReactNode {
  // **bold** → <strong>; остальное как есть
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return (
        <strong key={i} className="font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}
