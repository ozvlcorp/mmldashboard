# Dr Laz — AI medical assistant (mobile app)

A faithful, navigable implementation of the **Dr Laz** design handoff: an AI
medical assistant for Uzbekistan, in **Uzbek (Latin)** and **Russian**.

Built as a **React + Vite** app wrapped with **Capacitor** so it compiles to a
real installable **Android APK**.

## Screens & flow

- **Onboarding** — welcome + language pick → 3 feature cards → medical
  disclaimer → health profile.
- **Home (cockpit)** — health index, proactive AI note, quick actions, SOS.
- **Chat** — conversational AI with an interactive composer and action chips.
- **Consultation** — structured intake (body map, symptom tags) → diagnosis.
- **Prescription review** *(killer feature)* — AI checks another doctor's
  prescription for allergy conflicts / dose errors, each finding cited.
- **Diagnosis result** — ranked hypotheses, confidence ring, red flags.
- **Lab decoder** — CBC table with AI interpretation.
- **Upload picker**, **Medical card** timeline, **Prevention plan**,
  **Emergency / SOS**, **Subscription**.
- **Settings** — language, palette (clinical / warm / indigo), dark mode,
  AI name, tone, text size. Persisted to `localStorage`.

## Run locally (web preview)

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build the APK

The APK is compiled in CI (`.github/workflows/dr-laz-android.yml`) because the
authoring container can't reach Google's servers. On any push to the feature
branch the workflow builds a debug APK and attaches it to a GitHub **Release**.

To build locally instead (needs the Android SDK + JDK 17):

```bash
npm install
npm run build
npx cap add android
npx capacitor-assets generate --android   # app icon + splash from assets/*.svg
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

## Project layout

```
src/
  design/      palettes, i18n dictionary (uz/ru), icon set
  app/         settings + nav + toast providers, App root
  components/  bottom tab bar, chat bubbles
  screens/     one file per screen
assets/        SVG sources for the launcher icon & splash
```

> **Note:** Dr Laz is a product concept/prototype. It is not a medical device
> and does not replace a licensed physician.
