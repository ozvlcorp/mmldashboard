// Dr Laz — Prevention plan: focus areas + daily habits for the next 4 weeks.
import React, { useState } from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';

export default function PreventionPlan() {
  const { c, T, isRu } = useDL();
  const { pop, push } = useNav();

  const focus = isRu ? [
    { area: 'Сердце', s: 72, target: 88, c: c.alert, why: 'АД растёт 3 недели', icon: 'pulse' },
    { area: 'ЖКТ', s: 81, target: 90, c: c.warn, why: 'Гастрит в анамнезе', icon: 'drop' },
    { area: 'Сон', s: 64, target: 80, c: c.info, why: 'В среднем 5.8 ч/ночь', icon: 'moon' },
    { area: 'Активность', s: 86, target: 90, c: c.accent, why: '7800 шагов · норма', icon: 'activity' },
  ] : [
    { area: 'Yurak', s: 72, target: 88, c: c.alert, why: "AD 3 hafta koʻtarilmoqda", icon: 'pulse' },
    { area: "OIK", s: 81, target: 90, c: c.warn, why: 'Anamnezda gastrit', icon: 'drop' },
    { area: 'Uyqu', s: 64, target: 80, c: c.info, why: "Oʻrtacha 5.8 soat", icon: 'moon' },
    { area: 'Faollik', s: 86, target: 90, c: c.accent, why: "7800 qadam · meʼyor", icon: 'activity' },
  ];

  const initialHabits = isRu ? [
    { t: 'Соль < 5 г/сут', done: true, why: 'для АД' },
    { t: 'Кардио 30 мин ×3 в нед', done: true, why: 'для АД' },
    { t: 'Магний-цитрат 200 мг', done: false, why: 'для ЖКТ' },
    { t: 'Ложиться до 23:30', done: false, why: 'для сна' },
  ] : [
    { t: "Tuz < 5 g/sut", done: true, why: 'AD uchun' },
    { t: 'Kardio 30 daq · 3×hafta', done: true, why: 'AD uchun' },
    { t: 'Magniy-sitrat 200 mg', done: false, why: "OIK uchun" },
    { t: '23:30 gacha yotish', done: false, why: 'uyqu uchun' },
  ];
  const [habits, setHabits] = useState(initialHabits);
  const doneCount = habits.filter((h) => h.done).length;
  const toggle = (i) => setHabits((hs) => hs.map((h, k) => (k === i ? { ...h, done: !h.done } : h)));

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink, animation: 'dl-slide-in 0.25s ease both' }}>
      <div style={{ padding: '10px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="dl-press" onClick={pop} style={{ width: 36, height: 36, borderRadius: 11, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DLIcon name="chevL" size={16} color={c.ink} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{T.next4weeks}</div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', marginTop: 2 }}>{T.prevention}</div>
          </div>
        </div>
        <div className="dl-press" onClick={() => push('settings')} style={{ width: 36, height: 36, borderRadius: 11, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="settings" size={16} color={c.ink} strokeWidth={1.6} />
        </div>
      </div>

      <div className="dl-scroll" style={{ flex: 1, padding: '0 16px', paddingBottom: DL_BOTTOM_SAFE }}>
        {/* focus areas */}
        <div style={{ background: c.surface, borderRadius: 14, border: `0.5px solid ${c.line}`, padding: '12px 14px 14px', marginBottom: 12 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, color: c.inkSubtle, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            {isRu ? 'Зоны внимания' : "E'tibor zonalari"}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {focus.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: f.c + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DLIcon name={f.icon} size={15} color={f.c} strokeWidth={1.7} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13.5, fontWeight: 600, color: c.ink }}>{f.area}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.inkMuted }}>
                      <span style={{ color: f.c, fontWeight: 600 }}>{f.s}</span> → {f.target}
                    </div>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: c.surfaceSubtle, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, width: `${f.s}%`, background: f.c, borderRadius: 3 }} />
                    <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${f.target}%`, width: 2, background: c.ink, borderRadius: 1 }} />
                  </div>
                  <div style={{ marginTop: 3, fontFamily: 'Manrope, sans-serif', fontSize: 10.5, color: c.inkSubtle }}>{f.why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* daily habits */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {isRu ? 'Ежедневный план' : 'Kunlik reja'}
          </div>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.accent, fontWeight: 600 }}>{doneCount}/{habits.length}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {habits.map((h, i) => (
            <div key={i} className="dl-press" onClick={() => toggle(i)} style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 11, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: h.done ? c.accent : 'transparent', border: h.done ? 'none' : `1.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {h.done && <DLIcon name="check" size={13} color="#fff" strokeWidth={2.6} />}
              </div>
              <div style={{ flex: 1, fontFamily: 'Manrope, sans-serif', fontSize: 13, color: c.ink, fontWeight: 500, textDecoration: h.done ? 'line-through' : 'none', opacity: h.done ? 0.55 : 1 }}>{h.t}</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.04em' }}>{h.why}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
