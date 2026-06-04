// Dr Laz — chat message primitives (AI bubble, user bubble, numbered line).
import React from 'react';
import { DLIcon } from '../design/icons.jsx';

export function DLAIBubble({ c, aiName, children, flag }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', animation: 'dl-fade-in 0.25s ease both' }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8, background: c.primary, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <DLIcon name="cross" color="#fff" size={14} strokeWidth={2.6} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: c.inkMuted }}>{aiName}</div>
          {flag && (
            <div style={{
              padding: '1px 6px', borderRadius: 6, background: flag.color + '22', color: flag.color,
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{flag.label}</div>
          )}
        </div>
        <div style={{
          background: c.surface, borderRadius: '4px 14px 14px 14px',
          padding: '10px 12px', border: `0.5px solid ${c.line}`,
          fontFamily: 'Manrope, sans-serif', fontSize: 13.5, lineHeight: 1.5, color: c.ink,
        }}>{children}</div>
      </div>
    </div>
  );
}

export function DLAILine({ c, idx, text }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, background: c.surfaceSubtle,
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 600, color: c.primary,
      }}>{idx}</div>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, lineHeight: 1.45, color: c.ink, flex: 1 }}>{text}</div>
    </div>
  );
}

export function DLUserBubble({ c, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'dl-fade-in 0.25s ease both' }}>
      <div style={{
        maxWidth: '78%', background: c.primary, color: '#fff',
        borderRadius: '14px 14px 4px 14px', padding: '10px 12px',
        fontFamily: 'Manrope, sans-serif', fontSize: 13.5, lineHeight: 1.5,
      }}>{children}</div>
    </div>
  );
}
