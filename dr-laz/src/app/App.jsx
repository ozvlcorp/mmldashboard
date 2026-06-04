// Dr Laz — application root.
// Onboarding gate → tabbed shell (Home / Chat / Card / Profile) with a
// full-screen detail stack pushed on top. The whole UI is zoom-scaled by the
// text-size setting; safe-area insets are compensated so the status-bar gap
// stays exact at any zoom.
import React, { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

import { SettingsProvider, useSettings } from './settings.jsx';
import { NavProvider, useNav } from './nav.jsx';
import { ToastProvider } from './toast.jsx';

import Onboarding from '../screens/Onboarding.jsx';
import Cockpit from '../screens/Cockpit.jsx';
import Chat from '../screens/Chat.jsx';
import MedicalCard from '../screens/MedicalCard.jsx';
import Profile from '../screens/Profile.jsx';
import Consultation from '../screens/Consultation.jsx';
import PrescriptionReview from '../screens/PrescriptionReview.jsx';
import DiagnosisResult from '../screens/DiagnosisResult.jsx';
import LabDecode from '../screens/LabDecode.jsx';
import UploadPicker from '../screens/UploadPicker.jsx';
import PreventionPlan from '../screens/PreventionPlan.jsx';
import Emergency from '../screens/Emergency.jsx';
import Subscription from '../screens/Subscription.jsx';
import Settings from '../screens/Settings.jsx';

const TABS = { home: Cockpit, chat: Chat, card: MedicalCard, me: Profile };
const STACK = {
  consultation: Consultation,
  prescription: PrescriptionReview,
  diagnosis: DiagnosisResult,
  lab: LabDecode,
  upload: UploadPicker,
  prevention: PreventionPlan,
  emergency: Emergency,
  subscription: Subscription,
  settings: Settings,
};

function Shell() {
  const { tab, stack } = useNav();
  const TabScreen = TABS[tab] || Cockpit;
  return (
    <>
      <TabScreen key={tab} />
      {stack.map((s, i) => {
        const S = STACK[s.screen];
        if (!S) return null;
        return (
          <div key={`${s.screen}-${i}`} style={{ position: 'absolute', inset: 0, zIndex: 10 + i }}>
            <S {...(s.props || {})} />
          </div>
        );
      })}
    </>
  );
}

function Root() {
  const { settings, setTweak } = useSettings();
  const z = Math.min(1.34, Math.max(0.82, (settings.fontSize || 15) / 15));

  // Native chrome: overlay the status bar and tint its icons for the theme.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: settings.dark ? Style.Dark : Style.Light });
      } catch {
        /* plugin unavailable — ignore */
      }
    })();
  }, [settings.dark]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) SplashScreen.hide().catch(() => {});
  }, []);

  const wrapStyle = {
    width: '100%', height: '100%', position: 'relative',
    zoom: z,
    // Compensate env() by the zoom factor so the status-bar gap renders exactly.
    '--dl-safe-top': `calc(env(safe-area-inset-top, 0px) / ${z})`,
    '--dl-safe-bottom': `calc(env(safe-area-inset-bottom, 0px) / ${z})`,
  };

  if (!settings.onboarded) {
    return (
      <div style={wrapStyle}>
        <Onboarding onDone={() => setTweak('onboarded', true)} />
      </div>
    );
  }

  return (
    <NavProvider>
      <ToastProvider>
        <div style={wrapStyle}>
          <Shell />
        </div>
      </ToastProvider>
    </NavProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Root />
    </SettingsProvider>
  );
}
