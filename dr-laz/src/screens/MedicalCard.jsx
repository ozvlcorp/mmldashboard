// Dr Laz — Medical Card tab: health record timeline.
import React, { useState } from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';
import BottomTab from '../components/BottomTab.jsx';

export default function MedicalCard() {
  const { c, T, isRu } = useDL();
  const { push } = useNav();
  const [seg, setSeg] = useState(0);

  const timeline = (isRu ? [
    { d: '15 МАЯ', t: 'Сегодня', go: 'diagnosis', items: [{ icon: 'pulse', title: 'Боль в животе · аппендицит?', tag: 'Активно', tagC: c.alert }] },
    { d: '12 МАЯ', t: '3 дня назад', go: 'prescription', items: [{ icon: 'pill', title: 'Назначены 3 препарата', tag: '1 ошибка', tagC: c.warn }] },
    { d: '02 МАЯ', t: '2 недели', go: 'lab', items: [{ icon: 'file', title: 'ОАК · ОАМ · биохимия', tag: 'AI · OK', tagC: c.accent }] },
    { d: '14 АПР', t: 'Месяц назад', go: 'prevention', items: [{ icon: 'pulse', title: 'АД 142/92 · приём начат', tag: '', tagC: c.info }] },
    { d: '02 МАР', t: '', go: null, items: [{ icon: 'shield', title: 'Вакцинация — грипп', tag: '', tagC: c.accent }] },
  ] : [
    { d: '15 MAY', t: 'Bugun', go: 'diagnosis', items: [{ icon: 'pulse', title: "Qorin ogʻrigʻi · appenditsit?", tag: 'Faol', tagC: c.alert }] },
    { d: '12 MAY', t: '3 kun', go: 'prescription', items: [{ icon: 'pill', title: '3 ta dori buyurildi', tag: '1 xato', tagC: c.warn }] },
    { d: '02 MAY', t: '2 hafta', go: 'lab', items: [{ icon: 'file', title: "UQA · UQS · biokimyo", tag: 'AI · OK', tagC: c.accent }] },
    { d: '14 APR', t: 'Bir oy', go: 'prevention', items: [{ icon: 'pulse', title: "AD 142/92 · qabul boshlangan", tag: '', tagC: c.info }] },
    { d: '02 MAR', t: '', go: null, items: [{ icon: 'shield', title: 'Vaktsinatsiya — gripp', tag: '', tagC: c.accent }] },
  ]);

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink }}>
      {/* header */}
      <div style={{ padding: '10px 16px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em' }}>{T.medCard}</div>
          <div className="dl-press" style={{ width: 36, height: 36, borderRadius: 11, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DLIcon name="search" size={16} color={c.ink} strokeWidth={1.8} />
          </div>
        </div>

        {/* segmented control */}
        <div style={{ marginTop: 12, padding: 3, borderRadius: 11, background: c.surfaceSubtle, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {[T.timeline, T.findings, T.medications].map((s, i) => (
            <div key={s} className="dl-press" onClick={() => setSeg(i)} style={{ padding: '7px 0', borderRadius: 9, textAlign: 'center', background: i === seg ? c.surface : 'transparent', boxShadow: i === seg ? '0 1px 2px rgba(0,0,0,0.04)' : 'none', fontFamily: 'Manrope, sans-serif', fontSize: 12.5, fontWeight: i === seg ? 600 : 500, color: i === seg ? c.ink : c.inkMuted }}>{s}</div>
          ))}
        </div>
      </div>

      {/* timeline */}
      <div className="dl-scroll" style={{ flex: 1, padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {timeline.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 50, flexShrink: 0, paddingTop: 12, position: 'relative' }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 600, color: c.ink, letterSpacing: '0.04em' }}>{row.d}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: c.inkSubtle, marginTop: 1 }}>{row.t}</div>
                <div style={{ position: 'absolute', top: 18, right: -1, width: 2, bottom: -14, background: c.line }} />
                <div style={{ position: 'absolute', top: 16, right: -5, width: 10, height: 10, borderRadius: 5, background: c.bg, border: `2px solid ${ri === 0 ? c.alert : c.primary}`, zIndex: 1 }} />
              </div>
              <div style={{ flex: 1, padding: '12px 0' }}>
                {row.items.map((it, ii) => (
                  <div key={ii} className={row.go ? 'dl-press' : undefined} onClick={() => row.go && push(row.go)} style={{ background: c.surface, borderRadius: 12, border: `0.5px solid ${c.line}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: it.tagC + '18', color: it.tagC, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <DLIcon name={it.icon} size={16} color={it.tagC} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13.5, fontWeight: 600, color: c.ink, lineHeight: 1.25 }}>{it.title}</div>
                    </div>
                    {it.tag && (
                      <div style={{ padding: '3px 8px', borderRadius: 999, background: it.tagC + '20', color: it.tagC, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{it.tag}</div>
                    )}
                    {row.go && <DLIcon name="chevR" size={14} color={c.inkSubtle} strokeWidth={2} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomTab />
    </div>
  );
}
