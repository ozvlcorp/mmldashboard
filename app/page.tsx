import { Dashboard } from '@/components/dashboard';
import {
  DEMO_INVENTORY,
  DEMO_ABC,
  DEMO_XYZ,
  DEMO_RFM,
  DEMO_DEBTORS,
} from '@/lib/demo-data';

export default function HomePage() {
  return (
    <Dashboard
      inventory={DEMO_INVENTORY}
      abc={DEMO_ABC}
      xyz={DEMO_XYZ}
      rfm={DEMO_RFM}
      debtors={DEMO_DEBTORS}
      source="demo"
      currency="сум"
      horizonDays={10}
    />
  );
}
