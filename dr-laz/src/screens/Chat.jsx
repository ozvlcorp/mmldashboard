// Dr Laz — Chat tab: conversational AI (ChatGPT-style) with action chips.
import React, { useEffect, useRef, useState } from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';
import BottomTab from '../components/BottomTab.jsx';
import { DLAIBubble, DLUserBubble, DLAILine } from '../components/bubbles.jsx';

export default function Chat() {
  const { c, T, aiName, isRu } = useDL();
  const { push } = useNav();
  const scrollRef = useRef(null);
  const [typing, setTyping] = useState(false);

  const seed = [
    {
      role: 'ai',
      text: isRu
        ? 'Здравствуйте, Азиз. Я готов помочь. Расскажите, что вас беспокоит — можете описать словами, добавить фото или загрузить анализ.'
        : 'Assalomu alaykum, Aziz. Yordam berishga tayyorman. Sizni nima bezovta qilayotganini ayting — yozing, surat yuboring yoki analizingizni qoʻshing.',
    },
    {
      role: 'user',
      text: isRu
        ? '3 дня болит живот в правой нижней части, есть тошнота. Утром температура была 37.6.'
        : '3 kundan beri qornimning oʻng pastki qismi ogʻriydi, koʻngil aynaydi. Ertalab harorat 37.6 edi.',
    },
    {
      role: 'ai',
      flag: { label: isRu ? 'требует внимания' : 'eʼtibor talab qiladi', color: c.warn },
      title: isRu ? 'Не исключаю аппендицит.' : 'Appenditsitni istisno qilmayman.',
      text: isRu
        ? 'Боль в правой подвздошной области + тошнота + субфебрильная температура — характерная триада. Чтобы уточнить, нужны 2 проверки:'
        : 'Oʻng yonbosh sohasidagi ogʻriq + koʻngil aynashi + subfebril harorat — bu xarakterli triada. Aniqlash uchun 2 ta tekshiruv kerak:',
      lines: isRu
        ? ['Симптом Щёткина-Блюмберга (надавите и резко отпустите)', 'Общий анализ крови (лейкоциты, СРБ)']
        : ['Shchyotkin-Blyumberg simptomi (bosing va birdan qoʻyib yuboring)', 'Umumiy qon analizi (leykotsitlar, CRP)'],
    },
  ];

  const [messages, setMessages] = useState(seed);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setDraft('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, {
        role: 'ai',
        text: isRu
          ? 'Принял. Чтобы дать точную оценку, мне важны детали: когда началось, что усиливает боль, есть ли температура сейчас? Можно загрузить анализ — я сравню с вашей картой.'
          : 'Qabul qildim. Aniq baho berishim uchun tafsilotlar muhim: qachon boshlandi, ogʻriqni nima kuchaytiradi, hozir harorat bormi? Analiz yuklasangiz — kartangiz bilan solishtiraman.',
      }]);
    }, 850);
  };

  const chips = [
    { icon: 'pulse', label: T.symptomCheck, accent: c.primary, go: () => push('consultation') },
    { icon: 'file', label: T.decodeAnalysis, accent: c.accent, go: () => push('upload') },
    { icon: 'pill', label: T.checkPrescription, accent: c.warn, go: () => push('prescription') },
    { icon: 'shield', label: T.prevention, accent: c.info, go: () => push('prevention') },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: c.bg, paddingTop: DL_TOP }}>
      {/* top bar */}
      <div style={{ padding: '12px 18px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DLIcon name="cross" color="#fff" size={17} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{aiName}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.accent }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: c.accent, boxShadow: `0 0 0 3px ${c.accent}30` }} />
              {isRu ? 'на связи' : 'aloqada'}
            </div>
          </div>
        </div>
        <div className="dl-press" onClick={() => setMessages(seed)} style={{ width: 36, height: 36, borderRadius: 10, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.inkMuted }}>
          <DLIcon name="plus" size={18} color={c.inkMuted} strokeWidth={1.8} />
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="dl-scroll" style={{ flex: 1, padding: '8px 16px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: c.inkSubtle, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '4px 0 2px' }}>
          {T.today} · 14:22
        </div>

        {messages.map((m, i) => m.role === 'user' ? (
          <DLUserBubble key={i} c={c}>{m.text}</DLUserBubble>
        ) : (
          <DLAIBubble key={i} c={c} aiName={aiName} flag={m.flag}>
            {m.title && <div style={{ fontWeight: 600, color: c.ink, marginBottom: 4 }}>{m.title}</div>}
            <div style={{ color: m.title ? c.inkMuted : c.ink, fontSize: 13.5, lineHeight: 1.5 }}>{m.text}</div>
            {m.lines && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {m.lines.map((t, k) => <DLAILine key={k} c={c} idx={String(k + 1)} text={t} />)}
              </div>
            )}
          </DLAIBubble>
        ))}

        {typing && (
          <DLAIBubble c={c} aiName={aiName}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: c.inkSubtle, animation: `dl-pulse-ring 1s ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </DLAIBubble>
        )}
      </div>

      {/* action chip rail */}
      <div className="dl-scroll" style={{ padding: '6px 16px 10px', display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden' }}>
        {chips.map((ch, i) => (
          <div key={i} className="dl-press" onClick={ch.go} style={{ background: c.surface, border: `0.5px solid ${c.line}`, borderRadius: 999, padding: '8px 12px 8px 10px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <DLIcon name={ch.icon} size={14} color={ch.accent} strokeWidth={1.8} />
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12.5, color: c.ink, fontWeight: 500 }}>{ch.label}</div>
          </div>
        ))}
      </div>

      {/* composer */}
      <div style={{ padding: '8px 16px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="dl-press" onClick={() => push('upload')} style={{ width: 40, height: 40, borderRadius: 11, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.inkMuted, flexShrink: 0 }}>
          <DLIcon name="plus" size={18} color={c.inkMuted} strokeWidth={1.8} />
        </div>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={T.typeSomething}
          style={{
            flex: 1, height: 44, borderRadius: 22, background: c.surface, border: `0.5px solid ${c.line}`,
            padding: '0 16px', fontFamily: 'Manrope, sans-serif', fontSize: 14, color: c.ink, outline: 'none',
          }}
        />
        <div className="dl-press" onClick={send} style={{ width: 44, height: 44, borderRadius: 22, background: c.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <DLIcon name={draft.trim() ? 'send' : 'mic'} size={18} color="#fff" strokeWidth={1.8} />
        </div>
      </div>

      <BottomTab />
    </div>
  );
}
