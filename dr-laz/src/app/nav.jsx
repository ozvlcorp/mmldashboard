// Dr Laz — lightweight navigation.
// Bottom tabs select the root screen; detail screens are pushed onto a stack
// rendered full-screen on top, each with its own back/close affordance.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const NavCtx = createContext(null);

export function NavProvider({ children }) {
  const [tab, setTab] = useState('home'); // home | chat | card | me
  const [stack, setStack] = useState([]); // [{ screen, props }]

  const push = (screen, props = {}) =>
    setStack((s) => [...s, { screen, props }]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const resetStack = () => setStack([]);
  const goTab = (next) => {
    setStack([]);
    setTab(next);
  };

  const value = useMemo(
    () => ({ tab, setTab: goTab, stack, push, pop, resetStack }),
    [tab, stack]
  );
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}

export function useNav() {
  const ctx = useContext(NavCtx);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
