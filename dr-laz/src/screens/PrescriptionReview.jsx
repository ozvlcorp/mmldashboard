// Dr Laz — Killer feature: prescription/treatment review.
// AI sweeps another doctor's prescription for allergy conflicts, dose mistakes,
// interactions; confirms safe items. Each finding cites a research source.
import React from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';
import { useToast } from '../app/toast.jsx';

export default function PrescriptionReview() {
  const { c, T, isRu } = useDL();
  const { pop, push, setTab } = useNav();
  const toast = useToast();

  const findings = [
    {
      drug: 'Amoxiclav 875/125',
      dose: isRu ? '2 раза в день, 7 дней' : 'kuniga 2 marta, 7 kun',
      verdict: isRu ? 'Опасная аллергия' : 'Xavfli allergiya',
      detail: isRu
        ? 'В вашем профиле указана аллергия на пенициллин. Амоксиклав содержит амоксициллин (пенициллиновая группа) — риск анафилаксии.'
        : 'Profilingizda penitsillin allergiyasi qayd etilgan. Amoxiclav amoksitsillin saqlaydi (penitsillin guruhi) — anafilaksiya xavfi mavjud.',
      cite: 'BNF 2025 · Allergy cross-reactivity in β-lactams · 87%',
      severity: 'error',
    },
    {
      drug: 'Diclofenac 100 mg',
      dose: isRu ? '3 раза в день' : 'kuniga 3 marta',
      verdict: isRu ? 'Доза выше нормы' : 'Doza meʼyordan yuqori',
      detail: isRu
        ? 'Максимум 150 мг/сут. Назначено 300 мг — риск ЖКТ-кровотечения с учётом вашего гастрита.'
        : 'Maksimum 150 mg/sutka. Buyurilgan 300 mg — sizdagi gastrit hisobga olinsa, OIK-qon ketish xavfi.',
      cite: 'NICE NG177 · NSAID dosing in gastritis',
      severity: 'warn',
    },
    {
      drug: 'Omeprazol 20 mg',
      dose: isRu ? '1 раз в день, утром' : 'kuniga 1 marta, ertalab',
      verdict: T.confirmed,
      detail: isRu ? 'Корректно. Защищает желудок при приёме НПВС.' : "Toʻgʻri. NSAID qabulida oshqozonni himoya qiladi.",
      cite: 'UpToDate · PPI prophylaxis 2025',
      severity: 'ok',
    },
  ];

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink, animation: 'dl-slide-in 0.25s ease both' }}>
      {/* top nav */}
      <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="dl-press" onClick={pop} style={{ width: 36, height: 36, borderRadius: 11, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="chevL" size={16} color={c.ink} strokeWidth={2} />
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.12em', color: c.inkSubtle, textTransform: 'uppercase' }}>
          {isRu ? 'Проверка назначения' : 'Retsept tekshirilmoqda'}
        </div>
        <div className="dl-press" onClick={() => push('upload')} style={{ width: 36, height: 36, borderRadius: 11, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="upload" size={16} color={c.ink} strokeWidth={1.8} />
        </div>
      </div>

      <div className="dl-scroll" style={{ flex: 1, padding: '8px 16px 0' }}>
        {/* Source card */}
        <div style={{ background: c.surface, borderRadius: 14, padding: '12px 14px', border: `0.5px solid ${c.line}`, marginBottom: 12, display: 'flex', gap: 12 }}>
          <div style={{ width: 56, height: 72, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#f4ead2', position: 'relative', border: `0.5px solid ${c.line}` }}>
            <div style={{ position: 'absolute', inset: 0, padding: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[40, 60, 50, 70, 35, 55, 45].map((w, i) => (
                <div key={i} style={{ height: 2, width: `${w}%`, background: 'rgba(80,60,30,0.4)', borderRadius: 1 }} />
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, color: c.inkSubtle, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {T.yourDoctorSaid}
            </div>
            <div style={{ marginTop: 3, fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, color: c.ink, letterSpacing: '-0.01em' }}>
              {isRu ? 'Поликлиника №14' : 'Poliklinika №14'}
            </div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: c.inkMuted, marginTop: 1 }}>
              {isRu ? 'Терапевт · 12 мая · 3 препарата' : 'Terapevt · 12 may · 3 ta dori'}
            </div>
          </div>
        </div>

        {/* AI verdict header */}
        <div style={{ padding: '14px 14px', borderRadius: 14, marginBottom: 10, background: `linear-gradient(180deg, ${c.alert}12 0%, ${c.alert}04 100%)`, border: `0.5px solid ${c.alert}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <DLIcon name="alert" size={18} color={c.alert} strokeWidth={1.8} />
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: c.alert, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isRu ? '1 опасная ошибка · 1 коррекция' : '1 xavfli xato · 1 tuzatish'}
            </div>
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 600, color: c.ink, lineHeight: 1.4, textWrap: 'pretty' }}>
            {isRu ? 'Не принимайте назначение в текущем виде. Покажите врачу мои находки.' : "Buyurilgan davolanishni hozirgi koʻrinishda qabul qilmang. Topganlarimni shifokoringizga koʻrsating."}
          </div>
        </div>

        {/* findings list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {findings.map((f, i) => {
            const tone = {
              error: { dot: c.alert, label: T.risky, icon: 'alert' },
              warn: { dot: c.warn, label: T.correctionNeeded, icon: 'spark' },
              ok: { dot: c.accent, label: T.confirmed, icon: 'check' },
            }[f.severity];
            return (
              <div key={i} style={{ background: c.surface, borderRadius: 12, padding: '12px 14px', border: `0.5px solid ${c.line}`, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: tone.dot, borderRadius: '0 2px 2px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700, color: c.ink, letterSpacing: '-0.01em' }}>{f.drug}</div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: c.inkMuted, marginTop: 1 }}>{f.dose}</div>
                  </div>
                  <div style={{ padding: '3px 8px', borderRadius: 999, background: tone.dot + '20', color: tone.dot, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <DLIcon name={tone.icon} size={11} color={tone.dot} strokeWidth={2} />
                    {tone.label}
                  </div>
                </div>
                <div style={{ marginTop: 8, fontFamily: 'Manrope, sans-serif', fontSize: 13, color: c.ink, lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600, color: tone.dot }}>{f.verdict}.</span>{' '}
                  <span style={{ color: c.inkMuted }}>{f.detail}</span>
                </div>
                <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 7, background: c.surfaceSubtle, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DLIcon name="book" size={12} color={c.inkSubtle} strokeWidth={1.8} />
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkMuted, letterSpacing: '0.02em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.cite}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* action bar */}
      <div style={{ padding: '10px 16px', paddingBottom: DL_BOTTOM_SAFE, display: 'flex', gap: 8 }}>
        <div className="dl-press" onClick={() => setTab('chat')} style={{ flex: 1, height: 50, borderRadius: 13, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Manrope, sans-serif', fontSize: 13.5, fontWeight: 600, color: c.ink }}>
          <DLIcon name="chat" size={15} color={c.ink} strokeWidth={1.8} />
          {isRu ? 'Обсудить с AI' : "AI bilan muhokama"}
        </div>
        <div className="dl-press" onClick={() => toast(isRu ? 'Отправлено врачу ✓' : 'Shifokorga yuborildi ✓')} style={{ flex: 1.2, height: 50, borderRadius: 13, background: c.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'Manrope, sans-serif', fontSize: 13.5, fontWeight: 600 }}>
          <DLIcon name="send" size={15} color="#fff" strokeWidth={1.6} />
          {isRu ? 'Отправить врачу' : 'Shifokorga yuborish'}
        </div>
      </div>
    </div>
  );
}
