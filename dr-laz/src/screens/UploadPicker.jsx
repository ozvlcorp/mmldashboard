// Dr Laz — Upload picker (choose what to analyse → routes to the lab decoder).
import React from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';

export default function UploadPicker() {
  const { c, T, isRu } = useDL();
  const { pop, push } = useNav();

  const opts = [
    { icon: 'camera', label: T.photo, sub: isRu ? 'Снимок рецепта / анализа' : 'Retsept yoki analiz surati', color: c.primary, go: () => push('lab') },
    { icon: 'file', label: T.pdf, sub: isRu ? 'Загрузить PDF из файлов' : 'Fayllardan PDF yuklash', color: c.accent, go: () => push('lab') },
    { icon: 'mic', label: T.voice, sub: isRu ? 'Расскажите голосом' : 'Ovozda gapirib bering', color: c.warn, go: () => push('consultation') },
    { icon: 'pulse', label: 'EKG/ECG', sub: isRu ? 'Снимок ленты ЭКГ' : 'EKG lentasini suratga oling', color: c.info, go: () => push('lab') },
  ];

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink, animation: 'dl-fade-in 0.25s ease both' }}>
      <div style={{ padding: '10px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="dl-press" onClick={pop} style={{ width: 36, height: 36, borderRadius: 18, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="x" size={16} color={c.ink} strokeWidth={2} />
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {T.addFile}
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.15, textWrap: 'balance' }}>
          {isRu ? 'Что вы хотите проверить?' : 'Nimani tekshirmoqchisiz?'}
        </div>
        <div style={{ marginTop: 4, fontFamily: 'Manrope, sans-serif', fontSize: 13, color: c.inkMuted }}>
          {isRu ? 'AI расшифрует и сравнит с вашей картой здоровья.' : "AI izohlaydi va sogʻliq kartangiz bilan solishtiradi."}
        </div>
      </div>

      <div className="dl-scroll" style={{ flex: 1, padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((o, i) => (
          <div key={i} className="dl-press" onClick={o.go} style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: o.color + '18', color: o.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DLIcon name={o.icon} size={22} color={o.color} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, color: c.ink }}>{o.label}</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: c.inkMuted, marginTop: 1 }}>{o.sub}</div>
            </div>
            <DLIcon name="chevR" size={16} color={c.inkSubtle} strokeWidth={2} />
          </div>
        ))}

        {/* drop hint */}
        <div className="dl-press" onClick={() => push('lab')} style={{ margin: '4px 0 18px', padding: '18px 16px', borderRadius: 14, background: c.surfaceSubtle, border: `1.5px dashed ${c.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <DLIcon name="upload" size={20} color={c.primary} strokeWidth={1.6} />
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12.5, color: c.inkMuted, lineHeight: 1.4 }}>
            {isRu ? 'Перетащите файлы сюда или используйте Apple Health / Telegram.' : "Fayllarni shu yerga tashlang yoki Apple Health / Telegram dan import qiling."}
          </div>
        </div>
      </div>
    </div>
  );
}
