// Dr Laz — Structured "consultation room": AI conducts intake via cards.
import React, { useState } from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';

export default function Consultation() {
  const { c, T, aiName, isRu } = useDL();
  const { pop, push } = useNav();
  const steps = isRu
    ? ['Жалоба', 'Анамнез', 'Симптомы', 'Анализы', 'Диагноз', 'План']
    : ['Shikoyat', 'Anamnez', 'Simptomlar', 'Tahlillar', 'Tashxis', 'Reja'];
  const [currentStep, setCurrentStep] = useState(2);
  const [tags, setTags] = useState({ 1: true, 4: true });

  const next = () => {
    if (currentStep >= steps.length - 1) push('diagnosis');
    else setCurrentStep((s) => s + 1);
  };
  const back = () => {
    if (currentStep <= 0) pop();
    else setCurrentStep((s) => s - 1);
  };

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink, animation: 'dl-slide-in 0.25s ease both' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: c.inkSubtle, textTransform: 'uppercase' }}>
              {isRu ? 'Консультация · #1284' : 'Maslahat · #1284'}
            </div>
            <div style={{ marginTop: 2, fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {isRu ? 'Боль в животе' : 'Qorin ogʻrigʻi'}
            </div>
          </div>
          <div className="dl-press" onClick={pop} style={{ width: 36, height: 36, borderRadius: 18, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DLIcon name="x" size={16} color={c.inkMuted} strokeWidth={2} />
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ width: i === currentStep ? 26 : 16, height: 4, borderRadius: 2, background: i <= currentStep ? c.primary : c.line, transition: 'all 0.2s' }} />
          ))}
        </div>
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: c.inkSubtle, letterSpacing: '0.06em' }}>
          <span style={{ color: c.primary, fontWeight: 600 }}>{steps[currentStep].toUpperCase()}</span>
          <span>{currentStep + 1}/{steps.length}</span>
        </div>
      </div>

      {/* Step content */}
      <div className="dl-scroll" style={{ flex: 1, padding: '4px 16px 0' }}>
        <div style={{ background: c.surface, borderRadius: 16, padding: '16px 16px 14px', border: `0.5px solid ${c.line}`, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DLIcon name="cross" color="#fff" size={12} strokeWidth={2.8} />
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600 }}>{aiName} {isRu ? 'спрашивает' : 'soʻraydi'}</div>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 16, lineHeight: 1.35, color: c.ink, textWrap: 'pretty' }}>
            {isRu ? 'Где именно болит? Покажите на схеме — это поможет точнее определить причину.' : "Aniq qayerda ogʻriyapti? Sxemada koʻrsating — bu sababini aniqroq belgilashga yordam beradi."}
          </div>

          {/* body diagram */}
          <div style={{ marginTop: 14, background: c.surfaceSubtle, borderRadius: 12, padding: 14, position: 'relative', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 160" width="84" height="140" style={{ position: 'relative', zIndex: 1 }}>
              <ellipse cx="50" cy="20" rx="14" ry="16" fill="none" stroke={c.inkSubtle} strokeWidth="1.2" />
              <path d="M30 38 Q50 32 70 38 L78 95 Q70 110 50 110 Q30 110 22 95 Z" fill="none" stroke={c.inkSubtle} strokeWidth="1.2" />
              <path d="M30 38 Q15 44 18 80" fill="none" stroke={c.inkSubtle} strokeWidth="1.2" />
              <path d="M70 38 Q85 44 82 80" fill="none" stroke={c.inkSubtle} strokeWidth="1.2" />
              <path d="M40 110 L36 152" fill="none" stroke={c.inkSubtle} strokeWidth="1.2" />
              <path d="M60 110 L64 152" fill="none" stroke={c.inkSubtle} strokeWidth="1.2" />
              <circle cx="62" cy="90" r="14" fill={c.warn + '40'} />
              <circle cx="62" cy="90" r="6" fill={c.warn} />
            </svg>
            <div style={{ position: 'absolute', inset: '14px', borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', pointerEvents: 'none' }}>
              {['LU', 'RU', 'LL', 'RL'].map((q, i) => (
                <div key={q} style={{ border: `0.5px dashed ${c.line}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', padding: 4, fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: c.inkSubtle, letterSpacing: '0.04em', background: i === 3 ? c.warn + '08' : 'transparent' }}>{q}</div>
              ))}
            </div>
          </div>

          {/* tags */}
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(isRu ? ['Резкая', 'Ноющая', 'Постоянная', 'Приступы', 'Усиливается при ходьбе'] : ['Keskin', 'Ogʻir', 'Doimiy', 'Xurujlar', 'Yurganda kuchayadi']).map((t, i) => {
              const sel = !!tags[i];
              return (
                <div key={i} className="dl-press" onClick={() => setTags((p) => ({ ...p, [i]: !p[i] }))} style={{ padding: '6px 10px', borderRadius: 999, background: sel ? c.primary : c.surfaceSubtle, color: sel ? '#fff' : c.ink, border: sel ? 'none' : `1px solid ${c.line}`, fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 500 }}>{t}</div>
              );
            })}
          </div>
        </div>

        {/* live summary tile */}
        <div style={{ background: c.surface, borderRadius: 14, padding: '12px 14px', border: `0.5px solid ${c.line}` }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', color: c.inkSubtle, textTransform: 'uppercase', marginBottom: 6 }}>
            {isRu ? 'Что я уже знаю' : 'Men bilgan narsalar'}
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12.5, lineHeight: 1.5, color: c.ink }}>
            {isRu ? '34 г · муж · боль 3 дня · правый низ живота · тошнота · t° 37.6 · аллергия на пенициллин' : '34 yosh · erkak · ogʻriq 3 kun · oʻng pastki qorin · koʻngil aynashi · t° 37.6 · penitsillin allergiyasi'}
          </div>
        </div>
      </div>

      {/* nav bar */}
      <div style={{ padding: '12px 16px', paddingBottom: DL_BOTTOM_SAFE, display: 'flex', gap: 10 }}>
        <div className="dl-press" onClick={back} style={{ width: 54, height: 54, borderRadius: 14, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="chevL" size={18} color={c.inkMuted} strokeWidth={2} />
        </div>
        <div className="dl-press" onClick={next} style={{ flex: 1, height: 54, borderRadius: 14, background: c.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 600 }}>
          {currentStep >= steps.length - 1 ? T.diagnosis : T.next}
          <DLIcon name="chevR" size={18} color="#fff" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}
