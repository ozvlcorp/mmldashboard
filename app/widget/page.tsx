import { Dashboard } from '@/components/dashboard';
import {
  DEMO_INVENTORY,
  DEMO_ABC,
  DEMO_XYZ,
  DEMO_RFM,
  DEMO_DEBTORS,
} from '@/lib/demo-data';
import { verifyWidgetToken, parseClaims } from '@/lib/moysklad/widget';

type SearchParams = Promise<{ contextKey?: string; appUid?: string; locale?: string }>;

export const dynamic = 'force-dynamic';

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const secret = process.env.MOYSKLAD_SECRET_KEY;
  let context: { accountId: string; userId?: string } | null = null;
  let verifyError: string | null = null;

  if (params.contextKey && secret) {
    try {
      const claims = await verifyWidgetToken(params.contextKey, secret);
      context = parseClaims(claims);
    } catch (e: unknown) {
      verifyError = e instanceof Error ? e.message : String(e);
    }
  }

  return (
    <div>
      {verifyError && (
        <div className="mx-auto max-w-[1400px] px-4 pt-4">
          <div className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Ошибка проверки токена МойСклад: {verifyError}
          </div>
        </div>
      )}
      {!params.contextKey && !secret && (
        <div className="mx-auto max-w-[1400px] px-4 pt-4">
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Виджет открыт вне контекста МойСклад. Показаны демо-данные.
            Для продакшена настройте <code className="font-mono">MOYSKLAD_SECRET_KEY</code> и
            установите виджет через личный кабинет вендора.
          </div>
        </div>
      )}
      <Dashboard
        inventory={DEMO_INVENTORY}
        abc={DEMO_ABC}
        xyz={DEMO_XYZ}
        rfm={DEMO_RFM}
        debtors={DEMO_DEBTORS}
        source={context ? 'moysklad' : 'demo'}
        currency="сум"
        horizonDays={10}
      />
    </div>
  );
}
