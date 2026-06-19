'use client';

import * as React from 'react';
import { dict, type DictKey, type Lang } from './dict';

type Vars = Record<string, string | number>;

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey, vars?: Vars) => string;
  /** Увеличивается на каждом переключении — используем как key для пересоздания дерева с анимацией */
  nonce: number;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'oy-lang';

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'ru';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && (saved === 'ru' || saved === 'uz' || saved === 'en')) return saved;
  } catch {
    /* SSR */
  }
  return 'ru';
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>('ru');
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    setLangState(getInitialLang());
  }, []);

  const setLang = React.useCallback((next: Lang) => {
    setLangState(next);
    setNonce((n) => n + 1);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* quota */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next === 'uz' ? 'uz' : next;
    }
  }, []);

  const t = React.useCallback(
    (key: DictKey, vars?: Vars) => {
      const table = dict[lang] ?? dict.ru;
      const value = table[key] ?? dict.ru[key] ?? key;
      return interpolate(value, vars);
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, nonce }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('useT must be inside I18nProvider');
  return ctx;
}
