import { ListEntryGrid } from "@/app/components/list-entry-card";
import { ProjectCard } from "@/app/components/project-card";
import type { BuildingModuleSummary } from "@/app/lib/modules/types";
import type { ProjectSummary } from "@/app/lib/projects/types";

type ProjectListProps = {
  projects: ProjectSummary[];
  modules: BuildingModuleSummary[];
  staleCatalogPriceProjectIds?: ReadonlySet<string>;
};

export function ProjectList({
  projects,
  modules,
  staleCatalogPriceProjectIds = new Set(),
}: ProjectListProps) {
  return (
    <ListEntryGrid>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          modules={modules}
          hasStaleCatalogPrices={staleCatalogPriceProjectIds.has(project.id)}
        />
      ))}
    </ListEntryGrid>
  );
}
