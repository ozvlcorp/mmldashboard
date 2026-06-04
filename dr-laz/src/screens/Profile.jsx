// Dr Laz — Profile tab: identity, health profile summary, and entry points.
import React from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';
import BottomTab from '../components/BottomTab.jsx';

function Chip({ c, label, tone }) {
  return (
    <div style={{ padding: '5px 10px', borderRadius: 999, background: tone + '20', color: tone, fontFamily: 'Manrope, sans-serif', fontSize: 12.5, fontWeight: 500 }}>{label}</div>
  );
}

export default function Profile() {
  const { c, T, isRu } = useDL();
  const { push } = useNav();

  const menu = [
    { icon: 'star', label: T.subscribe, sub: isRu ? 'Premium · активна' : 'Premium · faol', tone: c.warn, go: () => push('subscription') },
    { icon: 'shield', label: T.prevention, sub: isRu ? 'План на 4 недели' : '4 haftalik reja', tone: c.accent, go: () => push('prevention') },
    { icon: 'book', label: T.medCard, sub: isRu ? 'История болезни' : 'Kasallik tarixi', tone: c.primary, go: () => push('lab') },
    { icon: 'alert', label: T.emergency, sub: isRu ? 'SOS · 103' : 'SOS · 103', tone: c.alert, go: () => push('emergency') },
    { icon: 'settings', label: T.settings, sub: isRu ? 'Язык, тема, AI' : 'Til, mavzu, AI', tone: c.inkMuted, go: () => push('settings') },
  ];

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink }}>
      <div className="dl-scroll" style={{ flex: 1, padding: '12px 16px 16px' }}>
        {/* identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '4px 2px 16px' }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#fff', fontSize: 20 }}>AK</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Aziz Karimov</div>
            <div style={{ marginTop: 2, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.inkSubtle, letterSpacing: '0.04em' }}>
              34 · {T.male} · {isRu ? 'Ташкент' : 'Toshkent'}
            </div>
          </div>
          <div style={{ padding: '5px 10px', borderRadius: 999, background: c.accent + '20', color: c.accentInk, fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <DLIcon name="star" size={11} color={c.accentInk} strokeWidth={2} />
            Premium
          </div>
        </div>

        {/* health profile summary */}
        <div style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 14, padding: '14px 14px', marginBottom: 14 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, color: c.inkSubtle, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{T.yourHealthProfile}</div>
          <div style={{ fontSize: 11, color: c.inkSubtle, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{T.chronicConditions}</div>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Chip c={c} label={isRu ? 'Гастрит' : 'Gastrit'} tone={c.primary} />
            <Chip c={c} label={isRu ? 'Гипертония I ст.' : 'Gipertoniya I dar.'} tone={c.primary} />
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: c.inkSubtle, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{T.allergies}</div>
          <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <Chip c={c} label={isRu ? 'Пенициллин' : 'Penitsillin'} tone={c.warn} />
            <Chip c={c} label={isRu ? 'Цитрусы' : 'Sitruslar'} tone={c.warn} />
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: c.inkSubtle, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{T.medications}</div>
          <div style={{ marginTop: 4, fontFamily: 'Manrope, sans-serif', fontSize: 14, color: c.inkMuted }}>
            {isRu ? 'Эналаприл 5 мг, утром' : 'Enalapril 5 mg, ertalab'}
          </div>
        </div>

        {/* menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {menu.map((m, i) => (
            <div key={i} className="dl-press" onClick={m.go} style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 13, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 13 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: m.tone + '18', color: m.tone, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DLIcon name={m.icon} size={19} color={m.tone} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 600, color: c.ink }}>{m.label}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: c.inkMuted, marginTop: 1 }}>{m.sub}</div>
              </div>
              <DLIcon name="chevR" size={16} color={c.inkSubtle} strokeWidth={2} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, padding: '0 4px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <DLIcon name="lock" size={13} color={c.inkSubtle} strokeWidth={1.7} />
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11.5, color: c.inkSubtle, lineHeight: 1.4 }}>
            {T.notDoctor}.
          </div>
        </div>
      </div>

      <BottomTab />
    </div>
  );
}
