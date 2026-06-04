// Dr Laz — bottom tab bar. Wired to the nav so taps switch root tabs.
import React from 'react';
import { DLIcon } from '../design/icons.jsx';
import { DL_BOTTOM_TAB } from '../design/palettes.js';
import { useDL } from '../app/settings.jsx';
import { useNav } from '../app/nav.jsx';

export default function BottomTab() {
  const { c, T } = useDL();
  const { tab, setTab } = useNav();
  const tabs = [
    { id: 'home', icon: 'home', label: T.home },
    { id: 'chat', icon: 'chat', label: T.chat },
    { id: 'card', icon: 'book', label: T.medCard },
    { id: 'me', icon: 'user', label: T.profile },
  ];
  return (
    <div style={{
      borderTop: `0.5px solid ${c.line}`, background: c.surface,
      paddingTop: 8, paddingBottom: DL_BOTTOM_TAB,
      display: 'flex',
    }}>
      {tabs.map((t) => {
        const on = t.id === tab;
        return (
          <div key={t.id} className="dl-press" onClick={() => setTab(t.id)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, color: on ? c.primary : c.inkSubtle, paddingTop: 2,
          }}>
            <DLIcon name={t.icon} size={22} color={on ? c.primary : c.inkSubtle} strokeWidth={on ? 1.9 : 1.5} />
            <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 10.5, fontWeight: on ? 600 : 500 }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}
