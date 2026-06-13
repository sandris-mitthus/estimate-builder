"use client";

import { useMemo, useState } from "react";
import { ProjectList } from "@/app/components/project-list";
import { ProjectStatusFilter } from "@/app/components/project-status-filter";
import {
  filterProjectsForArchive,
  type ProjectArchiveFilter,
} from "@/app/lib/projects/filter-projects";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";
import type { ProjectSummary } from "@/app/lib/projects/types";

type ProjectArchiveContentProps = {
  projects: ProjectSummary[];
  modules: BuildingModuleSummary[];
  staleCatalogPriceProjectIds: ReadonlySet<string>;
  newSagatavePositionProjectIds: ReadonlySet<string>;
  pendingMaterialsProjectIds: ReadonlySet<string>;
};

export function ProjectArchiveContent({
  projects,
  modules,
  staleCatalogPriceProjectIds,
  newSagatavePositionProjectIds,
  pendingMaterialsProjectIds,
}: ProjectArchiveContentProps) {
  const [filter, setFilter] = useState<ProjectArchiveFilter>("all");

  const filteredProjects = useMemo(
    () => filterProjectsForArchive(projects, filter),
    [projects, filter],
  );

  return (
    <div className="space-y-4">
      <ProjectStatusFilter
        id="project-archive-status"
        value={filter}
        onChange={setFilter}
      />

      {filteredProjects.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-10 text-center text-sm text-zinc-500">
          Nav projektu šajā filtrā.
        </p>
      ) : (
        <ProjectList
          projects={filteredProjects}
          modules={modules}
          staleCatalogPriceProjectIds={staleCatalogPriceProjectIds}
          newSagatavePositionProjectIds={newSagatavePositionProjectIds}
          pendingMaterialsProjectIds={pendingMaterialsProjectIds}
        />
      )}
    </div>
  );
}
