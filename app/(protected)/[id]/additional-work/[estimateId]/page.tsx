import Link from "next/link";
import { notFound } from "next/navigation";
import { EstimateTable } from "@/app/components/estimate-table";
import {
  getAdditionalWorkEstimate,
} from "@/app/lib/additional-work-estimates/repository";
import { assertNavAccess } from "@/app/lib/auth/assert-nav-access";
import { ensureDefaultEstimatePosition } from "@/app/lib/estimate-positions/repository";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { getProject } from "@/app/lib/projects/repository";
import { listPositionPrices } from "@/app/lib/positions/repository";
import { getCompanySettings } from "@/app/lib/settings/repository";
import { getServerTranslations } from "@/app/lib/i18n/server";

export default async function AdditionalWorkEstimatePage({
  params,
}: {
  params: Promise<{ id: string; estimateId: string }>;
}) {
  const session = await assertNavAccess("projects");
  if (!session) {
    return null;
  }

  const { id: projectId, estimateId } = await params;
  const additionalWorkEnabled = await isFrontendModuleEnabled(
    FRONTEND_MODULE_KEYS.additionalWork,
  );

  if (!additionalWorkEnabled) {
    notFound();
  }

  const { t } = await getServerTranslations();
  const [project, companySettings, catalogPositions, estimate, sagatave] =
    await Promise.all([
      getProject(projectId),
      getCompanySettings(),
      listPositionPrices(),
      getAdditionalWorkEstimate(projectId, estimateId),
      ensureDefaultEstimatePosition(),
    ]);

  if (!project || !estimate) {
    notFound();
  }

  return (
    <main className="page">
      <Link
        href={`/${projectId}`}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
      >
        <i className="fas fa-arrow-left text-xs" aria-hidden="true" />
        {t("additional_work.page.back", "Atpakaļ uz līguma tāmi")}
      </Link>

      <div className="mb-4 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
          {t("additional_work.page.title", "Papildu darbu tāme")}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          {estimate.title}
        </h1>
      </div>

      <EstimateTable
        estimateMode="additional_work"
        estimateId={estimateId}
        initialTitle={estimate.title}
        initialMeta={estimate.meta}
        initialCategories={estimate.categories}
        initialMultiOptionLinks={estimate.multiOptionLinks}
        estimateUpdatedAt={estimate.updatedAt}
        project={project}
        estimateValidityDays={companySettings.estimateValidityDays}
        catalogPositions={catalogPositions}
        defaultHourlyRate={companySettings.defaultHourlyRate}
        currency={companySettings.currency}
        sagataveSections={sagatave.sections}
      />
    </main>
  );
}
