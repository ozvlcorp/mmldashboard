// Dr Laz — Onboarding flow: Welcome → Features → Disclaimer → Health profile.
import React, { useState } from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL, useSettings } from '../app/settings.jsx';

function Shell({ c, children, bg }) {
  return (
    <div style={{
      height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
      background: bg || c.bg, color: c.ink, paddingTop: DL_TOP,
      animation: 'dl-fade-in 0.28s ease both',
    }}>
      {children}
    </div>
  );
}

function Welcome({ onNext }) {
  const { c, T, aiName, lang } = useDL();
  const { setTweak } = useSettings();
  return (
    <Shell c={c}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 28px 28px', paddingBottom: DL_BOTTOM_SAFE }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DLIcon name="cross" color="#fff" size={20} strokeWidth={2.2} />
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{aiName}</div>
        </div>

        <div style={{ marginTop: 80 }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.16em', color: c.inkMuted, textTransform: 'uppercase', marginBottom: 12 }}>
            AI · Tibbiyot · 2026
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, color: c.ink, textWrap: 'balance' }}>
            {T.onboardWelcome}
          </div>
          <div style={{ marginTop: 14, fontFamily: 'Manrope, sans-serif', fontSize: 15, lineHeight: 1.5, color: c.inkMuted, textWrap: 'pretty' }}>
            {T.onboardSub}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: c.inkSubtle, marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {T.chooseLang}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[{ id: 'uz', label: "O'zbekcha", flag: 'UZ' }, { id: 'ru', label: 'Русский', flag: 'RU' }].map((l) => {
              const active = lang === l.id;
              return (
                <div key={l.id} className="dl-press" onClick={() => setTweak('language', l.id)} style={{
                  flex: 1, padding: '12px 14px', borderRadius: 12,
                  background: active ? c.primary : c.surface, color: active ? '#fff' : c.ink,
                  border: `1px solid ${active ? c.primary : c.line}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600, opacity: 0.7 }}>{l.flag}</div>
                  <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 15 }}>{l.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dl-press" onClick={onNext} style={{
          background: c.ink, color: c.bg, height: 54, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 600,
        }}>
          {T.start}
          <DLIcon name="chevR" size={18} color={c.bg} strokeWidth={2.2} />
        </div>
      </div>
    </Shell>
  );
}

function Features({ onNext, onSkip }) {
  const { c, T, isRu } = useDL();
  const features = [
    { icon: 'spark', title: T.feature1Title, body: T.feature1Body, accent: c.primary },
    { icon: 'pulse', title: T.feature2Title, body: T.feature2Body, accent: c.accent },
    { icon: 'shield', title: T.feature3Title, body: T.feature3Body, accent: c.warn },
  ];
  return (
    <Shell c={c}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px 24px', paddingBottom: DL_BOTTOM_SAFE }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ width: i === 1 ? 18 : 6, height: 4, borderRadius: 2, background: i <= 1 ? c.primary : c.line }} />
            ))}
          </div>
          <div className="dl-press" onClick={onSkip} style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: c.inkSubtle }}>{T.skip}</div>
        </div>

        <div style={{ marginTop: 32, fontFamily: 'Manrope, sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, textWrap: 'balance' }}>
          {isRu ? 'Что умеет AI-врач' : 'AI-shifokor nima qila oladi'}
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: c.surface, borderRadius: 16, padding: '18px 16px', border: `0.5px solid ${c.line}`, display: 'flex', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: f.accent + '20', color: f.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DLIcon name={f.icon} size={22} color={f.accent} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 4, color: c.ink }}>{f.title}</div>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13.5, lineHeight: 1.45, color: c.inkMuted }}>{f.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="dl-press" onClick={onNext} style={{ background: c.ink, color: c.bg, height: 54, borderRadius: 14, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 600 }}>
          {T.continue}
        </div>
      </div>
    </Shell>
  );
}

function Disclaimer({ onNext }) {
  const { c, T, isRu } = useDL();
  const [agreed, setAgreed] = useState(true);
  const bullets = isRu ? [
    'AI-помощник не ставит окончательный диагноз и не выписывает рецепты как лицензированный врач.',
    'В случае ухудшения, сильной боли, кровотечения или потери сознания — немедленно звоните 103.',
    'Все рекомендации основаны на научных источниках, но решение всегда принимает лечащий врач.',
    'Ваши данные шифруются и не передаются третьим лицам без вашего согласия.',
  ] : [
    "AI-yordamchi yakuniy tashxis qo'ymaydi va litsenziyalangan shifokor sifatida retsept yozmaydi.",
    "Ahvolingiz yomonlashsa, kuchli og'riq, qon ketishi yoki hushdan ketish bo'lsa — 103 ga qo'ng'iroq qiling.",
    'Barcha tavsiyalar ilmiy manbalarga asoslangan, lekin yakuniy qaror — davolovchi shifokorniki.',
    "Ma'lumotlaringiz shifrlanadi va sizning roziligingizsiz uchinchi shaxslarga uzatilmaydi.",
  ];
  return (
    <Shell c={c}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px 24px', paddingBottom: DL_BOTTOM_SAFE }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: i === 2 ? 18 : 6, height: 4, borderRadius: 2, background: i <= 2 ? c.primary : c.line }} />
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: c.warn + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DLIcon name="alert" size={28} color={c.warn} strokeWidth={1.8} />
          </div>
          <div style={{ marginTop: 18, fontFamily: 'Manrope, sans-serif', fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05, textWrap: 'balance' }}>
            {T.disclaimerTitle}
          </div>
          <div style={{ marginTop: 8, fontFamily: 'Manrope, sans-serif', fontSize: 16, lineHeight: 1.4, color: c.inkMuted }}>
            {T.notDoctor}.
          </div>
        </div>

        <div className="dl-scroll" style={{ marginTop: 26, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {bullets.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, background: c.surfaceSubtle, color: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 600 }}>{i + 1}</div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13.5, lineHeight: 1.45, color: c.ink }}>{b}</div>
            </div>
          ))}
        </div>

        <div className="dl-press" onClick={() => setAgreed((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${agreed ? c.primary : c.line}`, background: agreed ? c.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {agreed && <DLIcon name="check" size={14} color="#fff" strokeWidth={2.4} />}
          </div>
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: c.inkMuted }}>
            {isRu ? 'Я прочитал и согласен' : "O'qib chiqdim va roziman"}
          </div>
        </div>

        <div className="dl-press" onClick={() => agreed && onNext()} style={{
          background: agreed ? c.primary : c.surfaceSubtle, color: agreed ? '#fff' : c.inkSubtle,
          height: 54, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 600,
          opacity: agreed ? 1 : 0.7,
        }}>{T.iUnderstand}</div>
      </div>
    </Shell>
  );
}

function Profile({ onDone }) {
  const { c, T, isRu } = useDL();
  return (
    <Shell c={c}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px 22px', paddingBottom: DL_BOTTOM_SAFE }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ width: i === 3 ? 18 : 6, height: 4, borderRadius: 2, background: c.primary }} />
          ))}
        </div>

        <div style={{ marginTop: 24, fontFamily: 'Manrope, sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, textWrap: 'balance' }}>
          {T.yourHealthProfile}
        </div>
        <div style={{ marginTop: 6, fontFamily: 'Manrope, sans-serif', fontSize: 14, color: c.inkMuted, lineHeight: 1.4 }}>
          {isRu ? 'AI-врач должен знать о вас всё, чтобы лечить без ошибок.' : "AI-shifokor xatosiz davolash uchun siz haqingizda bilishi kerak."}
        </div>

        <div className="dl-scroll" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <div style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: c.inkSubtle, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.name}</div>
            <div style={{ marginTop: 4, fontFamily: 'Manrope, sans-serif', fontSize: 16, color: c.ink, fontWeight: 500 }}>Aziz Karimov</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: c.inkSubtle, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.age}</div>
              <div style={{ marginTop: 4, fontFamily: 'IBM Plex Mono, monospace', fontSize: 18, color: c.ink, fontWeight: 500 }}>34</div>
            </div>
            <div style={{ flex: 1, background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: c.inkSubtle, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.sex}</div>
              <div style={{ marginTop: 4, fontFamily: 'Manrope, sans-serif', fontSize: 16, color: c.ink, fontWeight: 500 }}>{T.male}</div>
            </div>
          </div>

          <div style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: c.inkSubtle, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.chronicConditions}</div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[isRu ? 'Гастрит' : 'Gastrit', isRu ? 'Гипертония I ст.' : 'Gipertoniya I dar.', '+'].map((t, i) => (
                <div key={i} style={{ padding: '5px 10px', borderRadius: 999, background: i === 2 ? 'transparent' : c.chipBg, color: i === 2 ? c.inkSubtle : c.primaryInk, border: i === 2 ? `1px dashed ${c.line}` : 'none', fontFamily: 'Manrope, sans-serif', fontSize: 12.5, fontWeight: 500 }}>{t}</div>
              ))}
            </div>
          </div>

          <div style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: c.inkSubtle, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.allergies}</div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[isRu ? 'Пенициллин' : 'Penitsillin', isRu ? 'Цитрусы' : 'Sitruslar', '+'].map((t, i) => (
                <div key={i} style={{ padding: '5px 10px', borderRadius: 999, background: i === 2 ? 'transparent' : c.warn + '22', color: i === 2 ? c.inkSubtle : c.warn, border: i === 2 ? `1px dashed ${c.line}` : 'none', fontFamily: 'Manrope, sans-serif', fontSize: 12.5, fontWeight: 500 }}>{t}</div>
              ))}
            </div>
          </div>

          <div style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: c.inkSubtle, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{T.medications}</div>
            <div style={{ marginTop: 4, fontFamily: 'Manrope, sans-serif', fontSize: 14, color: c.inkMuted }}>
              {isRu ? 'Эналаприл 5 мг, утром' : 'Enalapril 5 mg, ertalab'}
            </div>
          </div>
        </div>

        <div className="dl-press" onClick={onDone} style={{ background: c.primary, color: '#fff', height: 54, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, sans-serif', fontSize: 16, fontWeight: 600, marginTop: 8 }}>
          {T.save}
        </div>
      </div>
    </Shell>
  );
}

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const next = () => setStep((s) => s + 1);
  if (step === 0) return <Welcome onNext={next} />;
  if (step === 1) return <Features onNext={next} onSkip={onDone} />;
  if (step === 2) return <Disclaimer onNext={next} />;
  return <Profile onDone={onDone} />;
}
