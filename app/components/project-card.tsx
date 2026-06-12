import Link from "next/link";
import { ProjectCardActions } from "@/app/components/project-card-actions";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";
import type { ProjectSummary } from "@/app/lib/projects/types";

const cardClassName =
  "rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md";
const cardClassNameDefault = `${cardClassName} border-zinc-200 hover:border-zinc-300`;
const cardClassNameStalePrices = `${cardClassName} border-red-300 hover:border-red-400`;

function resolveProjectModuleName(
  buildingModuleId: string | null,
  modules: BuildingModuleSummary[],
): string {
  if (!buildingModuleId) {
    return "Individuāls projekts";
  }

  return (
    modules.find((module) => module.id === buildingModuleId)?.name ??
    "Individuāls projekts"
  );
}

function ContactRow({
  icon,
  value,
}: {
  icon: string;
  value: string;
}) {
  if (!value.trim()) return null;

  return (
    <p className="flex items-center gap-2 text-sm text-zinc-600">
      <i className={`${icon} w-4 shrink-0 text-center text-xs text-zinc-400`} aria-hidden="true" />
      <span className="min-w-0 break-words">{value}</span>
    </p>
  );
}

export function ProjectCard({
  project,
  modules,
  hasStaleCatalogPrices = false,
}: {
  project: ProjectSummary;
  modules: BuildingModuleSummary[];
  hasStaleCatalogPrices?: boolean;
}) {
  const hasEmail = Boolean(project.email.trim());
  const hasPhone = Boolean(project.phone.trim());
  const moduleName = resolveProjectModuleName(project.buildingModuleId, modules);

  return (
    <div
      className={
        hasStaleCatalogPrices ? cardClassNameStalePrices : cardClassNameDefault
      }
    >
      <div className="flex items-start gap-3">
        <Link
          href={`/${project.id}`}
          className="group min-w-0 flex-1"
        >
          <p className="text-sm font-medium text-zinc-500">{moduleName}</p>
          <p className="mt-0.5 text-base font-semibold text-zinc-900 group-hover:text-zinc-700">
            {project.name}
          </p>

          {hasEmail || hasPhone ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
              <ContactRow icon="fas fa-envelope" value={project.email} />
              <ContactRow icon="fas fa-phone" value={project.phone} />
            </div>
          ) : null}

          {project.address.trim() ? (
            <p className="mt-4 flex items-start gap-2 text-sm text-zinc-600">
              <i
                className="fas fa-location-dot mt-0.5 w-4 shrink-0 text-center text-xs text-zinc-400"
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
        </Link>

        <ProjectCardActions project={project} modules={modules} />
      </div>
    </div>
  );
}
