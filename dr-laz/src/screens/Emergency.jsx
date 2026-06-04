// Dr Laz — Emergency / SOS screen (full-bleed alert, call 103, share location).
import React from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';
import { useToast } from '../app/toast.jsx';

export default function Emergency() {
  const { c, T, isRu } = useDL();
  const { pop } = useNav();
  const toast = useToast();

  const call = () => {
    // On a device this dials emergency services; harmless no-op on the web preview.
    try { window.location.href = 'tel:103'; } catch { /* ignore */ }
  };

  return (
    <div style={{ height: '100%', background: c.alert, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: '#fff', animation: 'dl-fade-in 0.2s ease both' }}>
      <div style={{ padding: '12px 18px 4px', display: 'flex', justifyContent: 'space-between' }}>
        <div className="dl-press" onClick={pop} style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="x" size={16} color="#fff" strokeWidth={2} />
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.85, alignSelf: 'center' }}>
          SOS · {isRu ? 'РЕЖИМ ТРЕВОГИ' : 'TASHVISH REJIMI'}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', width: 160, height: 160 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 80, background: 'rgba(255,255,255,0.12)', animation: 'dl-pulse-ring 2s ease-out infinite' }} />
            <div style={{ position: 'absolute', inset: 20, borderRadius: 60, background: 'rgba(255,255,255,0.16)' }} />
            <div style={{ position: 'absolute', inset: 40, borderRadius: 40, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DLIcon name="phone" size={36} color={c.alert} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, textAlign: 'center', textWrap: 'balance' }}>
          {T.emergencyCall}
        </div>
        <div style={{ marginTop: 8, fontFamily: 'Manrope, sans-serif', fontSize: 15, opacity: 0.9, lineHeight: 1.4, textAlign: 'center', textWrap: 'pretty' }}>
          {T.sosNote}
        </div>

        <div style={{ marginTop: 28, padding: '14px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <DLIcon name="target" size={18} color="#fff" strokeWidth={1.6} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, opacity: 0.7, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {isRu ? 'Ближайшая больница' : 'Yaqin kasalxona'}
            </div>
            <div style={{ marginTop: 2, fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600 }}>
              {isRu ? 'РКБ №1 · 2.4 км · ~6 мин' : "RKB №1 · 2.4 km · ~6 daq"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 18px', paddingBottom: DL_BOTTOM_SAFE }}>
        <div className="dl-press" onClick={call} style={{ background: '#fff', color: c.alert, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>
          <DLIcon name="phone" size={22} color={c.alert} strokeWidth={2.2} />
          {isRu ? 'Позвонить 103' : '103 ga qoʻngʻiroq'}
        </div>
        <div className="dl-press" onClick={() => toast(isRu ? 'Геолокация отправлена близкому ✓' : 'Geo-joylashuv yuborildi ✓')} style={{ marginTop: 8, height: 50, borderRadius: 14, border: '1px solid rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Manrope, sans-serif', fontSize: 14, fontWeight: 600, color: '#fff' }}>
          <DLIcon name="user" size={16} color="#fff" strokeWidth={1.8} />
          {isRu ? 'Отправить геолокацию близкому' : "Yaqiningizga geo-joylashuv yuborish"}
        </div>
      </div>
    </div>
  );
}
