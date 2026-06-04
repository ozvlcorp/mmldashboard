// Dr Laz — design tokens.
// Clinical/trustworthy palette: deep teal + mint on warm off-white.
// Each palette has light + dark variants. Dark variants preserve the brand
// (primary hue) but invert surfaces and lift accents for AA contrast.

export const DL_PALETTES = {
  clinical: {
    light: {
      bg: '#f4f7f6', surface: '#ffffff', surfaceSubtle: '#eef2f1',
      ink: '#0e1f24', inkMuted: '#4b6068', inkSubtle: '#7a8c94', line: '#dde4e3',
      primary: '#0a4d68', primaryInk: '#053342',
      accent: '#56c596', accentInk: '#1d6b4a',
      warn: '#d68a3c', alert: '#c0392b', info: '#3d7e9a',
      chipBg: '#e6efed',
    },
    dark: {
      bg: '#0b1518', surface: '#152125', surfaceSubtle: '#0f1b1e',
      ink: '#eaf1f0', inkMuted: '#9fb3b7', inkSubtle: '#6a8086', line: '#243135',
      primary: '#56c596', primaryInk: '#0a4d68',
      accent: '#7ad0c9', accentInk: '#0a4d68',
      warn: '#e6b87a', alert: '#ed7a6c', info: '#8cc0d6',
      chipBg: '#1a292d',
    },
  },
  warm: {
    light: {
      bg: '#f5f1ea', surface: '#ffffff', surfaceSubtle: '#ece6dc',
      ink: '#2d2218', inkMuted: '#6a5b48', inkSubtle: '#8e8170', line: '#dfd5c4',
      primary: '#7a3b3b', primaryInk: '#4d2424',
      accent: '#c8a04d', accentInk: '#7a5d20',
      warn: '#c66a2b', alert: '#b5443a', info: '#85694d',
      chipBg: '#ece4d4',
    },
    dark: {
      bg: '#1a1410', surface: '#241c16', surfaceSubtle: '#1f1812',
      ink: '#f0e8db', inkMuted: '#b8a890', inkSubtle: '#85775f', line: '#3a2f24',
      primary: '#e08a7a', primaryInk: '#7a3b3b',
      accent: '#e6c578', accentInk: '#5d4a18',
      warn: '#e6a070', alert: '#e88a7e', info: '#b8a087',
      chipBg: '#2a2018',
    },
  },
  indigo: {
    light: {
      bg: '#f6f7fc', surface: '#ffffff', surfaceSubtle: '#ecedf6',
      ink: '#0e1130', inkMuted: '#4e5278', inkSubtle: '#7e8299', line: '#dadce8',
      primary: '#3a3aa0', primaryInk: '#1e1f5e',
      accent: '#7c6bff', accentInk: '#3b318a',
      warn: '#d68a3c', alert: '#c0392b', info: '#5e6dad',
      chipBg: '#e8e9f4',
    },
    dark: {
      bg: '#0c0d20', surface: '#171830', surfaceSubtle: '#111228',
      ink: '#e9eaf6', inkMuted: '#a4a8c8', inkSubtle: '#7a7e9c', line: '#262842',
      primary: '#a39bff', primaryInk: '#1e1f5e',
      accent: '#7c6bff', accentInk: '#1e1f5e',
      warn: '#e6b87a', alert: '#ed7a6c', info: '#8c98d6',
      chipBg: '#1c1d36',
    },
  },
};

export function dlResolvePalette(name, dark) {
  const fam = DL_PALETTES[name] || DL_PALETTES.clinical;
  return (dark ? fam.dark : fam.light) || fam.light;
}

// ─── Layout constants ────────────────────────────────────────────────
// On a real device the screen *is* the phone, so we clear the OS status bar
// and home-indicator with the safe-area insets instead of the fixed 54px the
// mockups baked in for their on-canvas device frame.
// --dl-safe-* are set by App.jsx (env() divided by the UI zoom factor) so the
// status-bar gap stays exact even when the text-size slider scales the UI.
export const DL_TOP = 'calc(var(--dl-safe-top, 0px) + 16px)';
export const DL_BOTTOM_TAB = 'calc(var(--dl-safe-bottom, 0px) + 10px)';
export const DL_BOTTOM_SAFE = 'calc(var(--dl-safe-bottom, 0px) + 14px)';
