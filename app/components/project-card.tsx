"use client";

import Link from "next/link";
import { approvedEstimateSurfaceClassName } from "@/app/components/approved-estimate-status-label";
import { PendingProjectMaterialsCardHint } from "@/app/components/pending-project-materials-banner";
import { ProjectCardActions } from "@/app/components/project-card-actions";
import { useOptionalProjectsPageCreate } from "@/app/components/projects-page-create-context";
import { useTranslations } from "@/app/components/translations-provider";
import { isPlainPrimaryNavigationClick } from "@/app/components/navigation-loading-context";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";
import type { ProjectSummary } from "@/app/lib/projects/types";

const cardClassNameBase =
  "rounded-2xl border p-5 shadow-sm transition hover:shadow-md";
const cardClassNameDefault = `${cardClassNameBase} border-zinc-200 bg-white hover:border-zinc-300`;
const cardClassNameApproved = `${cardClassNameBase} ${approvedEstimateSurfaceClassName} hover:border-green-300`;
const cardClassNameStalePrices = `${cardClassNameBase} border-red-300 bg-white hover:border-red-400`;
const cardClassNameNewSagatavePositions = `${cardClassNameBase} border-amber-300 bg-white hover:border-amber-400`;

function resolveProjectModuleName(
  buildingModuleId: string | null,
  modules: BuildingModuleSummary[],
  fallbackName: string,
): string {
  if (!buildingModuleId) {
    return fallbackName;
  }

  return (
    modules.find((module) => module.id === buildingModuleId)?.name ??
    fallbackName
  );
}

function ContactRow({
  icon,
  value,
  approved = false,
}: {
  icon: string;
  value: string;
  approved?: boolean;
}) {
  if (!value.trim()) return null;

  return (
    <p
      className={`flex items-center gap-2 text-sm ${
        approved ? "text-green-800" : "text-zinc-600"
      }`}
    >
      <i
        className={`${icon} w-4 shrink-0 text-center text-xs ${
          approved ? "text-green-700" : "text-zinc-400"
        }`}
        aria-hidden="true"
      />
      <span className="min-w-0 break-words">{value}</span>
    </p>
  );
}

export function ProjectCard({
  project,
  modules,
  hasStaleCatalogPrices = false,
  hasNewSagatavePositions = false,
  hasPendingMaterials = false,
  isCreating = false,
}: {
  project: ProjectSummary;
  modules: BuildingModuleSummary[];
  hasStaleCatalogPrices?: boolean;
  hasNewSagatavePositions?: boolean;
  hasPendingMaterials?: boolean;
  isCreating?: boolean;
}) {
  const pageCreate = useOptionalProjectsPageCreate();
  const { t } = useTranslations();
  const projectHref = `/${project.id}`;
  const hasEmail = Boolean(project.email.trim());
  const hasPhone = Boolean(project.phone.trim());
  const isApproved = project.status === "approved";
  const moduleName = resolveProjectModuleName(
    project.buildingModuleId,
    modules,
    t("projects.individual_project", "Individuāls projekts"),
  );

  const cardBody = (
    <>
      <p
        className={`text-sm font-medium ${
          isApproved ? "text-green-700" : "text-zinc-500"
        }`}
      >
        {moduleName}
      </p>
      <p
        className={`mt-0.5 text-base font-semibold ${
          isApproved
            ? "text-green-800 group-hover:text-green-900"
            : "text-zinc-900 group-hover:text-zinc-700"
        }`}
      >
        {project.name}
      </p>

      {hasEmail || hasPhone ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <ContactRow
            icon="fas fa-envelope"
            value={project.email}
            approved={isApproved}
          />
          <ContactRow
            icon="fas fa-phone"
            value={project.phone}
            approved={isApproved}
          />
        </div>
      ) : null}

      {project.address.trim() ? (
        <p
          className={`mt-4 flex items-start gap-2 text-sm ${
            isApproved ? "text-green-800" : "text-zinc-600"
          }`}
        >
          <i
            className={`fas fa-location-dot mt-0.5 w-4 shrink-0 text-center text-xs ${
              isApproved ? "text-green-700" : "text-zinc-400"
            }`}
            aria-hidden="true"
          />
          <span className="min-w-0 break-words">{project.address}</span>
        </p>
      ) : null}

      {hasStaleCatalogPrices ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <i className="fas fa-sync-alt text-[11px]" aria-hidden="true" />
          Ir jauninājumi izcenojumos
        </p>
      ) : null}

      {hasNewSagatavePositions ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <i className="fas fa-layer-group text-[11px]" aria-hidden="true" />
          Sagatavē ir pozīcijas, kuras nav šajā tāmē
        </p>
      ) : null}
    </>
  );

  return (
    <div
      className={`relative ${
        isApproved
          ? cardClassNameApproved
          : hasStaleCatalogPrices
            ? cardClassNameStalePrices
            : hasNewSagatavePositions
              ? cardClassNameNewSagatavePositions
              : cardClassNameDefault
      }`}
      aria-busy={isCreating}
    >
      <div className="flex items-start gap-3">
        {isCreating ? (
          <div className="min-w-0 flex-1">{cardBody}</div>
        ) : (
          <Link
            href={projectHref}
            className="group min-w-0 flex-1"
            onClick={(event) => {
              if (!isPlainPrimaryNavigationClick(event)) {
                return;
              }

              pageCreate?.beginProjectNavigation(projectHref);
            }}
          >
            {cardBody}
          </Link>
        )}

        {!isCreating ? <ProjectCardActions project={project} modules={modules} /> : null}
      </div>

      {hasPendingMaterials ? <PendingProjectMaterialsCardHint /> : null}

      {isCreating ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/55 backdrop-blur-[2px]"
          aria-hidden="true"
        >
          <i className="fas fa-spinner animate-spin text-2xl text-zinc-500" />
        </div>
      ) : null}
    </div>
  );
}
