import { ListEntryGrid } from "@/app/components/list-entry-card";
import { ProjectCard } from "@/app/components/project-card";
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
  return (
    <ListEntryGrid>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          modules={modules}
          hasStaleCatalogPrices={staleCatalogPriceProjectIds.has(project.id)}
          hasNewSagatavePositions={newSagatavePositionProjectIds.has(project.id)}
          hasPendingMaterials={pendingMaterialsProjectIds.has(project.id)}
        />
      ))}
    </ListEntryGrid>
  );
}
