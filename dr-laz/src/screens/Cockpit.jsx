// Dr Laz — Home tab: health cockpit dashboard (proactive AI surfacing risks).
import React from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';
import BottomTab from '../components/BottomTab.jsx';

export default function Cockpit() {
  const { c, T, isRu } = useDL();
  const { push, setTab } = useNav();

  const actions = [
    { icon: 'chat', label: T.askAI, c: c.primary, go: () => setTab('chat') },
    { icon: 'file', label: T.decodeAnalysis, c: c.accent, go: () => push('upload') },
    { icon: 'pill', label: T.checkPrescription, c: c.warn, go: () => push('prescription') },
    { icon: 'shield', label: T.secondOpinion, c: c.info, go: () => push('consultation') },
  ];

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP }}>
      <div className="dl-scroll" style={{ flex: 1, padding: '12px 18px 16px' }}>
        {/* greeting */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {isRu ? 'Среда · 15 мая' : 'Chorshanba · 15 may'}
            </div>
            <div style={{ marginTop: 2, fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {T.hi}, Aziz
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="dl-press" onClick={() => push('emergency')} style={{
              width: 38, height: 38, borderRadius: 19, background: c.alert + '18', color: c.alert,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <DLIcon name="alert" size={18} color={c.alert} strokeWidth={1.9} />
            </div>
            <div className="dl-press" onClick={() => setTab('me')} style={{
              width: 38, height: 38, borderRadius: 19, background: c.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color: '#fff', fontSize: 13,
            }}>AK</div>
          </div>
        </div>

        {/* Risk score hero */}
        <div style={{ background: `linear-gradient(135deg, ${c.primary} 0%, ${c.primaryInk} 100%)`, borderRadius: 18, padding: '16px 16px 14px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.08, background: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 40%)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, opacity: 0.7, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {isRu ? 'Индекс здоровья' : 'Sogʻliq indeksi'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>78</div>
                  <div style={{ fontSize: 16, opacity: 0.6, fontFamily: 'IBM Plex Mono, monospace' }}>/100</div>
                </div>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Manrope, sans-serif', fontSize: 11.5, color: c.accent }}>
                  <span>↑ 4</span>
                  <span style={{ opacity: 0.7 }}>{isRu ? 'за неделю' : 'haftada'}</span>
                </div>
              </div>
              <svg width="78" height="78" viewBox="0 0 78 78">
                <circle cx="39" cy="39" r="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                <circle cx="39" cy="39" r="32" fill="none" stroke={c.accent} strokeWidth="6" strokeDasharray={`${78 * 2.01} ${201}`} strokeDashoffset="0" transform="rotate(-90 39 39)" strokeLinecap="round" />
              </svg>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              {[{ label: 'АД', v: '128/84', flag: c.warn }, { label: T.pulse, v: '72', flag: c.accent }, { label: 'HbA1c', v: '5.4%', flag: c.accent }].map((m, i) => (
                <div key={i} style={{ flex: 1, padding: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, marginTop: 2, fontWeight: 500 }}>{m.v}</div>
                  <div style={{ width: 12, height: 2, marginTop: 4, background: m.flag, borderRadius: 1 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI proactive insight */}
        <div className="dl-press" onClick={() => push('prevention')} style={{ marginTop: 12, padding: '12px 14px', borderRadius: 14, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: c.warn + '20', color: c.warn, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DLIcon name="spark" size={16} color={c.warn} strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: c.warn, fontWeight: 600 }}>
                {isRu ? 'Заметка AI' : 'AI eslatmasi'}
              </div>
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13.5, lineHeight: 1.4, color: c.ink, fontWeight: 500 }}>
              {isRu ? 'Ваше АД растёт 3 неделю подряд. Стоит пересмотреть дозу эналаприла с врачом.' : 'Qon bosimingiz 3 hafta ketma-ket koʻtarilmoqda. Enalapril dozasini shifokor bilan qayta koʻrish lozim.'}
            </div>
          </div>
          <DLIcon name="chevR" size={16} color={c.inkSubtle} strokeWidth={2} />
        </div>

        {/* quick actions grid */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {T.quickActions}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {actions.map((a, i) => (
              <div key={i} className="dl-press" onClick={a.go} style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 12, padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 24, minHeight: 78 }}>
                <DLIcon name={a.icon} size={20} color={a.c} strokeWidth={1.7} />
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 13, color: c.ink, lineHeight: 1.25 }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomTab />
    </div>
  );
}
