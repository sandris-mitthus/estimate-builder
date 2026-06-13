import { PositionsPageContent } from "@/app/components/positions-page-content";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { listPositionPrices } from "@/app/lib/positions/repository";
import {
  DEFAULT_CURRENCY,
  isCurrencyCode,
} from "@/app/lib/settings/currencies";
import { getCompanySettings } from "@/app/lib/settings/repository";

export default async function PositionsPage() {
  await assertNavAccess("positions");

  const [positions, settings] = await Promise.all([
    listPositionPrices(),
    getCompanySettings(),
  ]);

  return (
    <PositionsPageContent
      initialPositions={positions}
      currency={
        isCurrencyCode(settings.currency)
          ? settings.currency
          : DEFAULT_CURRENCY
      }
    />
  );
}
