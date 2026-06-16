"use client";

import { ListEntryGrid } from "@/app/components/list-entry-card";
import { ProjectCard } from "@/app/components/project-card";
import {
  isOptimisticProjectId,
  useOptionalProjectsPageCreate,
} from "@/app/components/projects-page-create-context";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";
import type { ProjectSummary } from "@/app/lib/projects/types";

type ProjectListProps = {
  projects: ProjectSummary[];
  modules: BuildingModuleSummary[];
  staleCatalogPriceProjectIds?: ReadonlySet<string>;
  newSagatavePositionProjectIds?: ReadonlySet<string>;
  pendingMaterialsProjectIds?: ReadonlySet<string>;
};

export function ProjectList({
  projects,
  modules,
  staleCatalogPriceProjectIds = new Set(),
  newSagatavePositionProjectIds = new Set(),
  pendingMaterialsProjectIds = new Set(),
}: ProjectListProps) {
  const pageCreate = useOptionalProjectsPageCreate();
  const optimisticProject = pageCreate?.optimisticProject ?? null;

  const displayProjects: ProjectSummary[] = optimisticProject
    ? [optimisticProject, ...projects]
    : projects;

  return (
    <ListEntryGrid>
      {displayProjects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          modules={modules}
          isCreating={isOptimisticProjectId(project.id)}
          hasStaleCatalogPrices={
            !isOptimisticProjectId(project.id) &&
            staleCatalogPriceProjectIds.has(project.id)
          }
          hasNewSagatavePositions={
            !isOptimisticProjectId(project.id) &&
            newSagatavePositionProjectIds.has(project.id)
          }
          hasPendingMaterials={
            !isOptimisticProjectId(project.id) &&
            pendingMaterialsProjectIds.has(project.id)
          }
        />
      ))}
    </ListEntryGrid>
  );
}
