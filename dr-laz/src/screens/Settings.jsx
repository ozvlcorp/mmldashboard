// Dr Laz — Settings: the design "tweaks" exposed as real in-app settings.
import React from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL, useSettings } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';

function Section({ c, label }) {
  return (
    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '18px 2px 8px' }}>{label}</div>
  );
}

function Row({ c, children }) {
  return (
    <div style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 13, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>{children}</div>
  );
}

function Segmented({ c, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <div key={o.value} className="dl-press" onClick={() => onChange(o.value)} style={{ padding: '7px 12px', borderRadius: 9, background: on ? c.primary : c.surfaceSubtle, color: on ? '#fff' : c.ink, border: on ? 'none' : `1px solid ${c.line}`, fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: on ? 600 : 500 }}>{o.label}</div>
        );
      })}
    </div>
  );
}

function Toggle({ c, value, onChange }) {
  return (
    <div className="dl-press" onClick={() => onChange(!value)} style={{ width: 48, height: 28, borderRadius: 14, background: value ? c.primary : c.line, position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 22, height: 22, borderRadius: 11, background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

export default function Settings() {
  const { c, T, isRu } = useDL();
  const { settings: t, setTweak } = useSettings();
  const { pop, setTab } = useNav();

  const label = (k) => (isRu
    ? { lang: 'Язык', langSub: 'Интерфейс', theme: 'Тема и палитра', palette: 'Палитра', dark: 'Тёмная тема', ai: 'AI ассистент', aiName: 'Имя AI', tone: 'Стиль', typo: 'Типографика', font: 'Размер текста', clinical: 'Клиника', warm: 'Тепло', soft: 'Мягкий', direct: 'Прямой', replay: 'Показать онбординг заново' }
    : { lang: 'Til', langSub: 'Interfeys', theme: 'Mavzu va palitra', palette: 'Palitra', dark: 'Qora rejim', ai: 'AI yordamchi', aiName: 'AI ismi', tone: 'Uslub', typo: 'Tipografika', font: "Matn oʻlchami", clinical: 'Klinik', warm: 'Issiq', soft: 'Yumshoq', direct: "To'g'ri", replay: 'Onboardingni qayta koʻrsatish' })[k];

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink, animation: 'dl-slide-in 0.25s ease both' }}>
      {/* nav */}
      <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="dl-press" onClick={pop} style={{ width: 36, height: 36, borderRadius: 11, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="chevL" size={16} color={c.ink} strokeWidth={2} />
        </div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 700 }}>{T.settings}</div>
        <div style={{ width: 36 }} />
      </div>

      <div className="dl-scroll" style={{ flex: 1, padding: '4px 16px', paddingBottom: DL_BOTTOM_SAFE }}>
        <Section c={c} label={label('lang')} />
        <Row c={c}>
          <div style={{ flex: 1, fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 500 }}>{label('langSub')}</div>
          <Segmented c={c} value={t.language} onChange={(v) => setTweak('language', v)} options={[{ value: 'uz', label: "O'z" }, { value: 'ru', label: 'Ru' }]} />
        </Row>

        <Section c={c} label={label('theme')} />
        <Row c={c}>
          <div style={{ flex: 1, fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 500 }}>{label('palette')}</div>
          <Segmented c={c} value={t.palette} onChange={(v) => setTweak('palette', v)} options={[{ value: 'clinical', label: label('clinical') }, { value: 'warm', label: label('warm') }, { value: 'indigo', label: 'Indigo' }]} />
        </Row>
        <Row c={c}>
          <DLIcon name="moon" size={18} color={c.inkMuted} strokeWidth={1.7} />
          <div style={{ flex: 1, fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 500 }}>{label('dark')}</div>
          <Toggle c={c} value={t.dark} onChange={(v) => setTweak('dark', v)} />
        </Row>

        <Section c={c} label={label('ai')} />
        <Row c={c}>
          <div style={{ flex: 1, fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 500 }}>{label('aiName')}</div>
          <input value={t.aiName} onChange={(e) => setTweak('aiName', e.target.value)} placeholder="Dr Laz" style={{ width: 130, height: 36, borderRadius: 9, background: c.surfaceSubtle, border: `1px solid ${c.line}`, padding: '0 10px', fontFamily: 'Manrope, sans-serif', fontSize: 14, color: c.ink, textAlign: 'right', outline: 'none' }} />
        </Row>
        <Row c={c}>
          <div style={{ flex: 1, fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 500 }}>{label('tone')}</div>
          <Segmented c={c} value={t.tone} onChange={(v) => setTweak('tone', v)} options={[{ value: 'soft', label: label('soft') }, { value: 'direct', label: label('direct') }]} />
        </Row>

        <Section c={c} label={label('typo')} />
        <Row c={c}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 500 }}>{label('font')}</div>
            <input type="range" min={12} max={20} step={1} value={t.fontSize} onChange={(e) => setTweak('fontSize', Number(e.target.value))} style={{ width: '100%', marginTop: 8, accentColor: c.primary }} />
          </div>
          <div style={{ width: 46, textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, color: c.primary, fontWeight: 600 }}>{t.fontSize}px</div>
        </Row>

        <div style={{ height: 16 }} />
        <div className="dl-press" onClick={() => { setTweak('onboarded', false); setTab('home'); }} style={{ background: c.surfaceSubtle, border: `1px dashed ${c.line}`, borderRadius: 13, padding: '13px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: c.inkMuted, fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600 }}>
          <DLIcon name="spark" size={16} color={c.inkMuted} strokeWidth={1.7} />
          {label('replay')}
        </div>

        <div style={{ textAlign: 'center', marginTop: 18, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.08em' }}>
          Dr Laz · v1.0.0
        </div>
      </div>
    </div>
  );
}
