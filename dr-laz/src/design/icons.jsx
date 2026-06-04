// Dr Laz — minimal medical glyphs (geometric, not anatomical illustration).
import React from 'react';

export const DLIcon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.6 }) => {
  const s = strokeWidth;
  const c = color;
  const paths = {
    chat:    <path d="M4 6c0-1.1.9-2 2-2h12a2 2 0 012 2v8a2 2 0 01-2 2H10l-4 3v-3H6a2 2 0 01-2-2V6z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    cross:   <g stroke={c} strokeWidth={s} fill="none"><rect x="9" y="3.5" width="6" height="17" rx="1.2"/><rect x="3.5" y="9" width="17" height="6" rx="1.2"/></g>,
    pulse:   <path d="M3 12h3.5l2-6 3 12 3-8 2 2H21" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    file:    <path d="M6 3h8l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zM14 3v5h4" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    shield:  <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    alert:   <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round"><path d="M12 3l10 17H2L12 3z"/><path d="M12 10v5M12 17.5v.5"/></g>,
    user:    <g stroke={c} strokeWidth={s} fill="none"><circle cx="12" cy="8" r="3.5"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></g>,
    pill:    <g stroke={c} strokeWidth={s} fill="none"><rect x="3.5" y="9" width="17" height="6" rx="3" transform="rotate(-30 12 12)"/><path d="M8.5 7.5l7 4" /></g>,
    upload:  <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/></g>,
    plus:    <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></g>,
    chevR:   <path d="M9 5l7 7-7 7" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    chevL:   <path d="M15 5l-7 7 7 7" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    chevD:   <path d="M5 9l7 7 7-7" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    home:    <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    book:    <path d="M4 4h6a3 3 0 013 3v13a3 3 0 00-3-3H4V4zM20 4h-6a3 3 0 00-3 3v13a3 3 0 013-3h6V4z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    spark:   <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l3 3M15.5 15.5l3 3M5.5 18.5l3-3M15.5 8.5l3-3"/></g>,
    check:   <path d="M5 12l4 4 10-10" stroke={c} strokeWidth={s + .2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    x:       <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></g>,
    search:  <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round"><circle cx="11" cy="11" r="6"/><path d="M16 16l4 4"/></g>,
    mic:     <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></g>,
    send:    <path d="M3 12L21 3l-4 18-5-7-9-2z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    camera:  <g stroke={c} strokeWidth={s} fill="none"><path d="M3 7a2 2 0 012-2h3l2-2h4l2 2h3a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/><circle cx="12" cy="13" r="4"/></g>,
    micro:   <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round"><path d="M4 12c2 0 2-4 4-4s2 8 4 8 2-8 4-8 2 4 4 4"/></g>,
    drop:    <path d="M12 3c4 6 6 9 6 12a6 6 0 11-12 0c0-3 2-6 6-12z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    activity: <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l3-7 4 14 3-7h4"/></g>,
    clock:   <g stroke={c} strokeWidth={s} fill="none" strokeLinecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2.5"/></g>,
    star:    <path d="M12 3l2.7 6 6.3.8-4.6 4.3 1.2 6.4L12 17.5 6.4 20.5l1.2-6.4L3 9.8l6.3-.8L12 3z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    bell:    <path d="M6 9a6 6 0 0112 0v4l2 3H4l2-3V9zM10 19a2 2 0 004 0" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    phone:   <path d="M5 3.5l3-.5 2 4-2 1.5a12 12 0 005.5 5.5L15 12l4 2-.5 3a2 2 0 01-2 1.5C9 18 6 15 5.5 6.5A2 2 0 015 3.5z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    eye:     <g stroke={c} strokeWidth={s} fill="none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></g>,
    flame:   <path d="M12 3c1 3 4 4 4 8a4 4 0 11-8 0c0-2 1-3 2-4-1 0-1.5-2 2-4z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    settings:<g stroke={c} strokeWidth={s} fill="none"><circle cx="12" cy="12" r="3"/><path d="M19.4 14a7.9 7.9 0 000-4l2-1.5-2-3.5-2.4.7a8 8 0 00-3.4-2L13 1h-2l-.6 2.7a8 8 0 00-3.4 2L4.6 5 2.6 8.5 4.6 10a7.9 7.9 0 000 4l-2 1.5 2 3.5 2.4-.7a8 8 0 003.4 2L11 23h2l.6-2.7a8 8 0 003.4-2l2.4.7 2-3.5L19.4 14z"/></g>,
    target:  <g stroke={c} strokeWidth={s} fill="none"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.2" fill={c} stroke="none"/></g>,
    leaf:    <path d="M4 20c0-9 7-16 16-16-1 9-7 16-16 16zm0 0l10-10" stroke={c} strokeWidth={s} fill="none" strokeLinecap="round" strokeLinejoin="round"/>,
    moon:    <path d="M20 14a8 8 0 01-10-10 8 8 0 1010 10z" stroke={c} strokeWidth={s} fill="none" strokeLinejoin="round"/>,
    lock:    <g stroke={c} strokeWidth={s} fill="none"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></g>,
    globe:   <g stroke={c} strokeWidth={s} fill="none"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
};

// Minimal placeholder tile (kept for parity with the design system).
export const DLPlaceholder = ({ label = 'image', w = '100%', h = 120, c }) => (
  <div style={{
    width: w, height: h, background: `repeating-linear-gradient(45deg, ${c.surfaceSubtle}, ${c.surfaceSubtle} 6px, ${c.surface} 6px, ${c.surface} 12px)`,
    border: `0.5px dashed ${c.line}`,
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
    fontSize: 10, letterSpacing: '0.04em', color: c.inkSubtle,
    textTransform: 'uppercase',
  }}>{label}</div>
);
