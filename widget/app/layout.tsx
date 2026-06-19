import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { I18nProvider } from '@/lib/i18n/provider';

export const metadata: Metadata = {
  title: 'OY Analytics — виджет для МойСклад',
  description:
    'OY Analytics: складская аналитика, ABC / XYZ / RFM, контроль долгов. Для МойСклад.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <I18nProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
