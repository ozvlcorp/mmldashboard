// Dr Laz — app settings (palette / language / dark / font / AI persona).
// Persisted to localStorage so the choice survives app restarts.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dlResolvePalette } from '../design/palettes.js';
import { DL_DICT } from '../design/i18n.js';

const DEFAULTS = {
  palette: 'clinical',
  language: 'uz',
  aiName: 'Dr Laz',
  fontSize: 15,
  tone: 'direct',
  dark: false,
  onboarded: false,
};

const STORAGE_KEY = 'drlaz.settings.v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

const SettingsCtx = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage may be unavailable — non-fatal */
    }
    // Keep the document background in sync so overscroll/safe areas match theme.
    const c = dlResolvePalette(settings.palette, settings.dark);
    document.body.style.background = c.bg;
  }, [settings]);

  const setTweak = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const value = useMemo(() => ({ settings, setTweak, setSettings }), [settings]);
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

// Resolves the live design context (tokens + translator) from current settings.
// This is the screens' single source of truth, replacing the design's prop drill.
export function useDL() {
  const { settings: t } = useSettings();
  return useMemo(() => {
    const c = dlResolvePalette(t.palette, !!t.dark);
    const lang = t.language || 'uz';
    const T = DL_DICT[lang] || DL_DICT.uz;
    return {
      c,
      T,
      lang,
      isRu: lang === 'ru',
      aiName: t.aiName || 'Dr Laz',
      tone: t.tone || 'direct',
      dark: !!t.dark,
      font: t.fontSize || 15,
    };
  }, [t.palette, t.dark, t.language, t.aiName, t.tone, t.fontSize]);
}
