import { EstimatePositionTable } from "@/app/components/estimate-position-table";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { listBuildingModuleSizeOptions } from "@/app/lib/modules/repository";
import { toEstimateCatalogPositions } from "@/app/lib/positions/estimate-catalog";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";

export default async function SagatavePage() {
  const session = await assertNavAccess("estimate");
  if (!session) {
    return null;
  }

  const [sagatave, catalogPositions, companySettings, moduleSizeOptions] =
    await Promise.all([
      ensureDefaultEstimatePosition(),
      listPositionPrices(),
      getCompanySettings(),
      listBuildingModuleSizeOptions(),
    ]);

  return (
    <main className="page">
      <EstimatePositionTable
        estimatePositionId={sagatave.id}
        initialTitle={sagatave.title}
        initialSections={sagatave.sections}
        initialMultiOptionLinks={sagatave.multiOptionLinks}
        catalogPositions={toEstimateCatalogPositions(catalogPositions)}
        defaultHourlyRate={companySettings.defaultHourlyRate}
        currency={companySettings.currency}
        moduleSizeOptions={moduleSizeOptions}
      />
    </main>
  );
}
