// Dr Laz — Subscription / plans (Free / Premium / Family).
import React, { useState } from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_TOP, DL_BOTTOM_SAFE } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';
import { useToast } from '../app/toast.jsx';

export default function Subscription() {
  const { c, T, isRu } = useDL();
  const { pop } = useNav();
  const toast = useToast();
  const [selected, setSelected] = useState('pro');

  const plans = [
    {
      id: 'free', name: T.free, price: '0', per: '',
      tag: isRu ? 'Старт' : 'Boshlash', tagC: c.inkSubtle, accent: c.inkSubtle,
      bullets: isRu ? ['5 запросов в день', 'Базовая расшифровка', 'Без истории'] : ['Kuniga 5 soʻrov', 'Asosiy izoh', 'Tarixsiz'],
    },
    {
      id: 'pro', name: T.premium, price: '49 000', per: T.perMonth,
      tag: isRu ? 'Популярный' : 'Mashhur', tagC: c.primary, accent: c.primary,
      bullets: isRu
        ? ['Безлимитный AI-чат', 'Расшифровка любых анализов', 'Проверка назначений врача', 'Полная мед. карта', '24/7 экстренный режим']
        : ['Cheksiz AI-suhbat', 'Har qanday analizni izohlash', 'Shifokor retseptini tekshirish', "Toʻliq tibbiy karta", "Favqulodda 24/7 rejim"],
    },
    {
      id: 'fam', name: T.family, price: '79 000', per: T.perMonth,
      tag: isRu ? 'До 5 человек' : '5 kishigacha', tagC: c.accent, accent: c.accent,
      bullets: isRu ? ['Всё из Premium', '5 профилей', 'Семейный доктор-чат'] : ['Premium dagi hamma', '5 ta profil', 'Oilaviy shifokor-chat'],
    },
  ];

  return (
    <div style={{ height: '100%', background: c.bg, display: 'flex', flexDirection: 'column', paddingTop: DL_TOP, color: c.ink, animation: 'dl-fade-in 0.25s ease both' }}>
      {/* nav */}
      <div style={{ padding: '10px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="dl-press" onClick={pop} style={{ width: 36, height: 36, borderRadius: 18, background: c.surface, border: `0.5px solid ${c.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DLIcon name="x" size={16} color={c.ink} strokeWidth={2} />
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '4px 22px 0' }}>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, textWrap: 'balance' }}>
          {isRu ? 'Личный AI-врач, всегда рядом' : "Shaxsiy AI-shifokor, doim yoningizda"}
        </div>
        <div style={{ marginTop: 8, fontFamily: 'Manrope, sans-serif', fontSize: 14, color: c.inkMuted, lineHeight: 1.4, textWrap: 'pretty' }}>
          {isRu ? 'Свежие клинические рекомендации, цитаты из исследований, проверка назначений вашего врача.' : "Yangi klinik koʻrsatmalar, ilmiy maqolalar iqtibos, shifokoringiz retseptini tekshirish."}
        </div>
      </div>

      <div className="dl-scroll" style={{ flex: 1, padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plans.map((p) => {
          const current = selected === p.id;
          return (
            <div key={p.id} className="dl-press" onClick={() => setSelected(p.id)} style={{ background: current ? c.ink : c.surface, color: current ? c.bg : c.ink, border: current ? 'none' : `0.5px solid ${c.line}`, borderRadius: 16, padding: '14px 16px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em' }}>{p.name}</div>
                    <div style={{ padding: '2px 7px', borderRadius: 999, background: current ? 'rgba(255,255,255,0.15)' : p.tagC + '20', color: current ? '#fff' : p.tagC, fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.tag}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em' }}>
                      {p.price === '0' ? T.free : p.price}
                    </div>
                    {p.price !== '0' && (
                      <>
                        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, opacity: 0.6 }}>UZS</div>
                        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, opacity: 0.6 }}>{p.per}</div>
                      </>
                    )}
                  </div>
                </div>
                {current && (
                  <div style={{ padding: '5px 10px', borderRadius: 999, background: c.accent, color: c.accentInk, fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <DLIcon name="check" size={11} color={c.accentInk} strokeWidth={3} />
                    {isRu ? 'Выбран' : 'Tanlandi'}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {p.bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DLIcon name="check" size={12} color={current ? c.accent : p.accent} strokeWidth={2.4} />
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12.5, opacity: current ? 0.85 : 1 }}>{b}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div style={{ marginTop: 4, padding: '8px 12px', borderRadius: 10, background: c.warn + '12', display: 'flex', alignItems: 'center', gap: 8 }}>
          <DLIcon name="star" size={14} color={c.warn} strokeWidth={1.6} />
          <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11.5, color: c.ink }}>
            {isRu ? 'Годовая подписка — −20% и 14 дней пробного' : "Yillik obuna — -20% va 14 kun bepul sinov"}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', paddingBottom: DL_BOTTOM_SAFE }}>
        <div className="dl-press" onClick={() => toast(isRu ? 'Оформление подписки…' : 'Obuna rasmiylashtirilmoqda…')} style={{ height: 54, borderRadius: 14, background: c.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700 }}>
          {isRu ? 'Продолжить с Premium' : "Premium bilan davom"}
        </div>
      </div>
    </div>
  );
}
