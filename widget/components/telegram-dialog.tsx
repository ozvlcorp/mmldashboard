'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Send, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/provider';
import {
  clearTelegramConfig,
  loadTelegramConfig,
  saveTelegramConfig,
  sendTelegram,
} from '@/lib/telegram-config';

export function TelegramDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useT();
  const [botToken, setBotToken] = React.useState('');
  const [chatId, setChatId] = React.useState('');
  const [testing, setTesting] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; msg: string } | null>(null);

  React.useEffect(() => {
    if (!open) {
      setResult(null);
      return;
    }
    const existing = loadTelegramConfig();
    if (existing) {
      setBotToken(existing.botToken);
      setChatId(existing.chatId);
    } else {
      setBotToken('');
      setChatId('');
    }
  }, [open]);

  const canSubmit = botToken.trim().length >= 10 && chatId.trim().length >= 1;

  async function handleTest() {
    setTesting(true);
    setResult(null);
    const cfg = { botToken: botToken.trim(), chatId: chatId.trim() };
    const text = '✓ OY Analytics: проверка подключения. Если видите это сообщение — бот настроен правильно.';
    const r = await sendTelegram(text, cfg);
    if (r.ok) {
      saveTelegramConfig(cfg);
      setResult({ ok: true, msg: t('tg.testOk') });
    } else {
      setResult({ ok: false, msg: r.error ?? t('tg.testFail') });
    }
    setTesting(false);
  }

  function handleSave() {
    if (!canSubmit) return;
    saveTelegramConfig({ botToken: botToken.trim(), chatId: chatId.trim() });
    setResult({ ok: true, msg: t('tg.saved') });
  }

  function handleClear() {
    clearTelegramConfig();
    setBotToken('');
    setChatId('');
    setResult({ ok: true, msg: t('tg.cleared') });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm oy-anim-fade" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92%] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-(--color-border) bg-(--color-card) p-6 shadow-2xl oy-anim-fade">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-[18px] font-bold tracking-tight">
                <Send size={17} className="text-(--color-primary)" />
                {t('tg.title')}
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-[12px] text-(--color-muted-fg)">
                {t('tg.subtitle')}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-1 hover:bg-(--color-muted)" aria-label="Close">
              <X size={16} className="text-(--color-muted-fg)" />
            </Dialog.Close>
          </div>

          <div className="mb-4 rounded-lg border border-(--color-border-soft) bg-(--color-muted)/40 px-3 py-2.5 text-[12px] leading-snug text-(--color-muted-fg)">
            <div className="font-semibold text-(--color-fg)">{t('tg.howto')}</div>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4">
              <li>{t('tg.step1')}</li>
              <li>{t('tg.step2')}</li>
              <li>{t('tg.step3')}</li>
              <li>{t('tg.step4')}</li>
            </ol>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleTest();
            }}
            className="space-y-3"
          >
            <label className="block">
              <div className="mb-1.5 text-[12px] font-semibold">{t('tg.botToken')}</div>
              <input
                type="password"
                required
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="123456789:AAH…"
                className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 font-mono text-[12px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20"
              />
            </label>
            <label className="block">
              <div className="mb-1.5 text-[12px] font-semibold">{t('tg.chatId')}</div>
              <input
                type="text"
                required
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="123456789"
                className="h-9 w-full rounded-lg border border-(--color-border) bg-(--color-bg) px-3 font-mono text-[12px] focus:border-(--color-primary)/40 focus:outline-none focus:ring-2 focus:ring-(--color-primary)/20"
              />
              <div className="mt-1 text-[11px] text-(--color-muted-fg)">{t('tg.chatIdHint')}</div>
            </label>

            {result && (
              <div
                className={
                  result.ok
                    ? 'flex items-start gap-2 rounded-md border border-emerald-300/40 bg-emerald-50/80 px-3 py-2 text-[12px] text-emerald-700'
                    : 'flex items-start gap-2 rounded-md border border-rose-300/40 bg-rose-50/80 px-3 py-2 text-[12px] text-rose-700'
                }
              >
                {result.ok ? <CheckCircle2 size={14} className="mt-px" /> : <AlertCircle size={14} className="mt-px" />}
                <span>{result.msg}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={handleClear} disabled={!botToken && !chatId}>
                <Trash2 size={13} />
                {t('tg.clear')}
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleSave} disabled={!canSubmit}>
                  {t('tg.save')}
                </Button>
                <Button type="submit" disabled={!canSubmit || testing}>
                  {testing && <Loader2 size={13} className="animate-spin" />}
                  {testing ? t('tg.testing') : t('tg.test')}
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
