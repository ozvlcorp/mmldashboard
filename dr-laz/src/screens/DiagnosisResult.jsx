// Dr Laz — Diagnosis result (full hypothesis card with confidence + red flags).
import React from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';
import { useToast } from '../app/toast.jsx';

export default function DiagnosisResult() {
  const { c, T, isRu } = useDL();
  const { pop } = useNav();
  const toast = useToast();

  const hypotheses = [
    { name: isRu ? 'Острый аппендицит' : 'Oʻtkir appenditsit', p: 72, color: c.alert, code: 'K35.8' },
    { name: isRu ? 'Мезаденит' : 'Mezadenit', p: 14, color: c.warn, code: 'I88.0' },
    { name: isRu ? 'Гастроэнтерит' : 'Gastroenterit', p: 8, color: c.info, code: 'K52.9' },
    { name: isRu ? 'Иные причины' : 'Boshqa sabablar', p: 6, color: c.inkSubtle, code: '—' },
  ];

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink, animation: 'dl-slide-in 0.25s ease both' }}>
      {/* nav */}
      <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="dl-press" onClick={pop} style={{ width: 36, height: 36, borderRadius: 11, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="chevL" size={16} color={c.ink} strokeWidth={2} />
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {isRu ? 'Гипотеза AI' : 'AI gipotezasi'}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="dl-scroll" style={{ flex: 1, padding: '8px 16px 0' }}>
        {/* main verdict */}
        <div style={{ padding: '16px 16px 14px', borderRadius: 16, marginBottom: 12, background: c.surface, border: `0.5px solid ${c.line}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {isRu ? 'Наиболее вероятно' : 'Eng ehtimol koʻp'}
              </div>
              <div style={{ marginTop: 4, fontFamily: 'Manrope, sans-serif', fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: c.ink, textWrap: 'balance' }}>
                {hypotheses[0].name}
              </div>
              <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.inkSubtle }}>ICD-10 · {hypotheses[0].code}</span>
                <span style={{ width: 3, height: 3, borderRadius: 2, background: c.inkSubtle }} />
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.alert, fontWeight: 600 }}>{T.riskHigh}</span>
              </div>
            </div>
            <div style={{ width: 76, height: 76, position: 'relative', flexShrink: 0 }}>
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="32" fill="none" stroke={c.surfaceSubtle} strokeWidth="6" />
                <circle cx="38" cy="38" r="32" fill="none" stroke={c.alert} strokeWidth="6" strokeDasharray={`${201 * 0.72} 201`} strokeLinecap="round" transform="rotate(-90 38 38)" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: c.alert, lineHeight: 1 }}>72%</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8, color: c.inkSubtle, textTransform: 'uppercase' }}>{T.confidence}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, height: 6, borderRadius: 3, background: c.surfaceSubtle, overflow: 'hidden', display: 'flex' }}>
            {hypotheses.map((h, i) => (
              <div key={i} style={{ width: `${h.p}%`, background: h.color, marginRight: i < hypotheses.length - 1 ? 2 : 0, borderRadius: 1 }} />
            ))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {hypotheses.slice(1).map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: h.color }} />
                <div style={{ flex: 1, fontFamily: 'Manrope, sans-serif', fontSize: 12.5, color: c.ink }}>{h.name}</div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.inkSubtle }}>{h.p}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* red flags */}
        <div style={{ padding: '12px 14px', borderRadius: 14, background: c.alert + '0c', border: `0.5px solid ${c.alert}40`, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <DLIcon name="alert" size={14} color={c.alert} strokeWidth={2} />
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.alert, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{T.redFlags}</div>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, lineHeight: 1.45, color: c.ink, fontWeight: 500 }}>
            {isRu ? 'Усиление боли · рвота · t° > 38.5 · доска живота → СРОЧНО в приёмное отделение.' : "Ogʻriqning kuchayishi · qusish · t° > 38.5 · qattiq qorin → SHOSHILINCH qabul boʻlimiga."}
          </div>
        </div>

        {/* recommended actions */}
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          {T.recommendations}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(isRu ? [
            { i: 1, t: 'УЗИ органов брюшной полости — в течение 6 часов' },
            { i: 2, t: 'Не есть, не пить, не принимать обезболивающие' },
            { i: 3, t: 'Подготовить страховой полис и паспорт' },
          ] : [
            { i: 1, t: "Qorin a'zolari UZI — 6 soat ichida" },
            { i: 2, t: "Yemang, ichmang, og'riq qoldiruvchi olmang" },
            { i: 3, t: 'Sugʻurta polisi va pasportni tayyorlang' },
          ]).map((a) => (
            <div key={a.i} style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 11, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: c.primary + '15', color: c.primary, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{a.i}</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: c.ink, flex: 1 }}>{a.t}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px', paddingBottom: DL_BOTTOM_SAFE, display: 'flex', gap: 8 }}>
        <div className="dl-press" onClick={() => toast(isRu ? 'Источники: BNF, NICE, UpToDate' : 'Manbalar: BNF, NICE, UpToDate')} style={{ width: 50, height: 50, borderRadius: 13, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <DLIcon name="book" size={18} color={c.ink} strokeWidth={1.8} />
        </div>
        <div className="dl-press" onClick={() => toast(isRu ? 'Запись на приём оформлена ✓' : 'Qabulga yozildingiz ✓')} style={{ flex: 1, height: 50, borderRadius: 13, background: c.alert, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 700 }}>
          <DLIcon name="phone" size={16} color="#fff" strokeWidth={1.8} />
          {T.bookVisit}
        </div>
      </div>
    </div>
  );
}
