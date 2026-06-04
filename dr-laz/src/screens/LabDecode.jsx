// Dr Laz — Lab upload / analysis decoder (CBC-style values with AI summary).
import React from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';

export default function LabDecode() {
  const { c, T, aiName, isRu } = useDL();
  const { pop, push } = useNav();

  const labs = [
    { n: 'WBC', v: '14.2', u: '10⁹/L', ref: '4.0–9.0', flag: 'high' },
    { n: 'Neutrophils', v: '78', u: '%', ref: '40–75', flag: 'high' },
    { n: 'Hb', v: '13.4', u: 'g/dL', ref: '13.0–17.0', flag: 'ok' },
    { n: 'CRP', v: '38', u: 'mg/L', ref: '< 5', flag: 'high' },
    { n: 'PLT', v: '298', u: '10⁹/L', ref: '150–400', flag: 'ok' },
    { n: 'ESR', v: '24', u: 'mm/h', ref: '0–15', flag: 'high' },
  ];
  const flagColor = (f) => (f === 'high' ? c.alert : f === 'low' ? c.info : c.accent);

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink, animation: 'dl-slide-in 0.25s ease both' }}>
      {/* nav */}
      <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="dl-press" onClick={pop} style={{ width: 36, height: 36, borderRadius: 11, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="chevL" size={16} color={c.ink} strokeWidth={2} />
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.12em', color: c.inkSubtle, textTransform: 'uppercase' }}>
          {isRu ? 'Расшифровка ОАК' : "UQA izohi"}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="dl-scroll" style={{ flex: 1, padding: '8px 16px 0' }}>
        {/* AI summary */}
        <div style={{ background: c.surface, borderRadius: 14, padding: '14px 14px', border: `0.5px solid ${c.line}`, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DLIcon name="cross" color="#fff" size={13} strokeWidth={2.6} />
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600 }}>{aiName}</div>
            <div style={{ marginLeft: 'auto', padding: '2px 8px', borderRadius: 999, background: c.warn + '20', color: c.warn, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {T.riskMed}
            </div>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14.5, lineHeight: 1.45, color: c.ink, fontWeight: 500 }}>
            {isRu ? 'Признаки острого бактериального воспаления.' : "Oʻtkir bakterial yallig'lanish belgilari."}
          </div>
          <div style={{ marginTop: 4, fontFamily: 'Manrope, sans-serif', fontSize: 13, lineHeight: 1.45, color: c.inkMuted, textWrap: 'pretty' }}>
            {isRu
              ? 'Лейкоциты 14.2 + сдвиг влево (нейтрофилы 78%) + СРБ 38 — в сочетании с болью в правом нижнем квадранте подтверждает подозрение на острый аппендицит.'
              : "Leykotsitlar 14.2 + chap surilish (neytrofillar 78%) + CRP 38 — oʻng pastki kvadrantdagi ogʻriq bilan birga oʻtkir appenditsit shubhasini tasdiqlaydi."}
          </div>
        </div>

        {/* labs table */}
        <div style={{ background: c.surface, borderRadius: 14, border: `0.5px solid ${c.line}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px 8px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.9fr 0.3fr', gap: 6, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: c.inkSubtle, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            <div>Marker</div><div style={{ textAlign: 'right' }}>{isRu ? 'Знач.' : 'Qiymat'}</div><div style={{ textAlign: 'right' }}>{isRu ? 'Норма' : 'Norma'}</div><div />
          </div>
          {labs.map((l, i) => (
            <div key={i} style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 0.9fr 0.3fr', gap: 6, alignItems: 'center', borderTop: `0.5px solid ${c.line}`, background: l.flag !== 'ok' ? flagColor(l.flag) + '06' : 'transparent' }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13.5, fontWeight: 500, color: c.ink }}>{l.n}</div>
              <div style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, color: l.flag !== 'ok' ? flagColor(l.flag) : c.ink, fontWeight: 500 }}>
                {l.v} <span style={{ fontSize: 9, color: c.inkSubtle, marginLeft: 1 }}>{l.u}</span>
              </div>
              <div style={{ textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.inkSubtle }}>{l.ref}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {l.flag === 'high' && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.alert, fontWeight: 600 }}>↑</div>}
                {l.flag === 'low' && <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.info, fontWeight: 600 }}>↓</div>}
                {l.flag === 'ok' && <div style={{ width: 6, height: 6, borderRadius: 3, background: c.accent, marginLeft: 'auto' }} />}
              </div>
            </div>
          ))}
        </div>

        {/* next step CTA */}
        <div className="dl-press" onClick={() => push('diagnosis')} style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: c.primary + '0e', border: `0.5px solid ${c.primary}40`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <DLIcon name="target" size={20} color={c.primary} strokeWidth={1.8} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12.5, fontWeight: 600, color: c.primaryInk }}>
              {isRu ? 'Срочно к хирургу' : 'Shoshilinch jarrohga'}
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: c.inkMuted, marginTop: 1 }}>
              {isRu ? 'УЗИ органов брюшной полости в ближайшие 6 часов' : "Yaqin 6 soat ichida qorin a'zolari UZI"}
            </div>
          </div>
          <DLIcon name="chevR" size={16} color={c.primary} strokeWidth={2} />
        </div>
      </div>

      <div style={{ padding: '10px 16px', paddingBottom: DL_BOTTOM_SAFE, display: 'flex', gap: 8 }}>
        <div className="dl-press" onClick={() => push('diagnosis')} style={{ flex: 1, height: 50, borderRadius: 13, background: c.ink, color: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600 }}>
          <DLIcon name="chat" size={15} color={c.bg} strokeWidth={1.8} />
          {isRu ? 'Что мне делать?' : "Nima qilishim kerak?"}
        </div>
      </div>
    </div>
  );
}
