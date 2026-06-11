import { EstimatePositionTable } from "@/app/components/estimate-position-table";

import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";

import { listPositionPrices } from "@/app/lib/positions/repository";

import { getCompanySettings } from "@/app/lib/settings/repository";



export default async function SagatavePage() {

  const [sagatave, catalogPositions, companySettings] = await Promise.all([

    ensureDefaultEstimatePosition(),

    listPositionPrices(),

    getCompanySettings(),

  ]);



  return (

    <main className="page">

      <EstimatePositionTable

        estimatePositionId={sagatave.id}

        initialTitle={sagatave.title}

        initialSections={sagatave.sections}
        initialMultiOptionLinks={sagatave.multiOptionLinks}

        catalogPositions={catalogPositions}

        defaultHourlyRate={companySettings.defaultHourlyRate}

      />

    </main>

  );

}

